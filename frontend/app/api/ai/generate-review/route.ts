import { NextRequest, NextResponse } from 'next/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface GenerateReviewRequest {
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  timePeriod: string;
  customDateRange?: { start: string; end: string };
  tone: string;
  aiSettingsId?: string;
  providerKeyId?: string; // Optional: specific key to use
}

// Lazy initialization of Supabase client to avoid build-time errors
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing. Please check your environment variables.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  return supabaseClient;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateReviewRequest = await request.json();

    // Validate required fields
    if (!body.employeeId || !body.employeeName || !body.jobTitle) {
      return NextResponse.json(
        { error: 'Missing required employee information' },
        { status: 400 }
      );
    }

    console.log('Generating review for:', body.employeeName, 'using provider:', body.providerKeyId || 'default');

    // Initialize Supabase client
    let supabase;
    try {
      supabase = getSupabaseClient();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to initialize database connection';
      console.error('Supabase initialization error:', errorMsg);
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY environment variable. Please add it to your deployment environment. Get it from Supabase Dashboard → Project Settings → Data API → service_role key.' },
        { status: 500 }
      );
    }

    // Fetch AI settings
    const { data: aiSettings, error: aiSettingsError } = await supabase
      .from('ai_settings')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000002')
      .single();

    if (aiSettingsError) {
      console.error('Error fetching AI settings:', aiSettingsError);
    }

    // Fetch the default or specified AI provider key
    let providerQuery = supabase
      .from('ai_provider_keys')
      .select('*')
      .eq('is_active', true);

    if (body.providerKeyId) {
      providerQuery = providerQuery.eq('id', body.providerKeyId);
    } else {
      providerQuery = providerQuery.eq('is_default', true);
    }

    const { data: providerKey, error: providerError } = await providerQuery.single();

    if (providerError || !providerKey) {
      console.error('Provider key error:', providerError);
      return NextResponse.json(
        { error: 'No active AI provider key configured. Please add your API key in Settings > AI Keys.' },
        { status: 400 }
      );
    }

    console.log('Found provider key:', providerKey.provider_name, 'model:', providerKey.default_model);

    // Validate the provider key status
    if (providerKey.validation_status === 'invalid' || providerKey.validation_status === 'expired') {
      return NextResponse.json(
        { error: `Your ${providerKey.provider_name} API key is ${providerKey.validation_status}. Please update it in Settings > AI Keys.` },
        { status: 400 }
      );
    }

    // Build the time period description
    let periodText: string;
    if (body.customDateRange?.start && body.customDateRange?.end) {
      const start = new Date(body.customDateRange.start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const end = new Date(body.customDateRange.end).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      periodText = `the period from ${start} to ${end}`;
    } else {
      periodText =
        body.timePeriod === 'last_30_days'
          ? 'the past 30 days'
          : body.timePeriod === 'last_quarter'
            ? 'the last quarter'
            : body.timePeriod === 'last_6_months'
              ? 'the last 6 months'
              : 'the past year';
    }

    // Build the system prompt based on AI settings
    const instructions = aiSettings?.review_instructions || '';
    const focusAreas: string[] = aiSettings?.focus_areas || ['upsell_metrics', 'table_turn_speed', 'guest_satisfaction'];
    const maxLength = aiSettings?.max_review_length || 500;
    const includeSuggestions = aiSettings?.include_suggestions !== false;
    const effectiveTone = body.tone || aiSettings?.review_tone || 'professional';

    // Focus areas descriptions
    const focusDescriptions: Record<string, string> = {
      upsell_metrics: 'demonstrating strong upselling skills and contributing to revenue growth',
      table_turn_speed: 'maintaining efficient table turn times while ensuring quality service',
      guest_satisfaction: 'consistently delivering exceptional guest experiences',
      teamwork: 'collaborating effectively with team members',
      punctuality: 'maintaining excellent attendance and punctuality',
      menu_knowledge: 'showcasing comprehensive menu knowledge and recommendations',
    };

    const focusAreasText = focusAreas
      .map((area) => focusDescriptions[area] || area.replace(/_/g, ' '))
      .join(', ');

    // Build tone-specific instructions
    const toneInstructions: Record<string, string> = {
      professional: 'Use a professional, business-appropriate tone. Be formal but not cold.',
      friendly: 'Use a warm, friendly tone that sounds genuine and approachable.',
      direct: 'Be direct and concise. Focus on facts without flowery language.',
      detailed: 'Provide detailed observations with specific examples.',
    };

    const systemPrompt = `You are an expert HR professional writing performance reviews for restaurant staff.
${instructions ? `\nCompany guidelines: ${instructions}` : ''}
${aiSettings?.custom_prompt_template ? `\nCustom template: ${aiSettings.custom_prompt_template}` : ''}

Tone requirements: ${toneInstructions[effectiveTone] || toneInstructions.professional}
Focus areas to emphasize: ${focusAreasText}
${includeSuggestions ? 'Include 1-2 constructive suggestions for improvement.' : 'Do not include suggestions for improvement.'}
Maximum length: ${maxLength} characters.`;

    const userPrompt = `Write a performance review for ${body.employeeName}, a ${body.jobTitle}, for ${periodText}.

The review should highlight their strengths in: ${focusAreasText}.

Write a complete, well-structured performance review that a restaurant manager would be proud to share.`;

    // Generate the review using the appropriate provider
    let generatedReview: string;

    try {
      generatedReview = await generateWithProvider(providerKey, systemPrompt, userPrompt, maxLength);

      // Update usage stats
      await supabase
        .from('ai_provider_keys')
        .update({
          monthly_usage_count: providerKey.monthly_usage_count + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', providerKey.id);

    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Check for specific API errors
      if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        // Mark key as invalid
        await supabase
          .from('ai_provider_keys')
          .update({
            validation_status: 'invalid',
            validation_error: 'API key unauthorized - please check your key',
          })
          .eq('id', providerKey.id);

        return NextResponse.json(
          { error: 'Your API key appears to be invalid or expired. Please update it in Settings > AI Keys.' },
          { status: 401 }
        );
      }

      if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
        return NextResponse.json(
          { error: 'Rate limit exceeded. Please try again in a moment.' },
          { status: 429 }
        );
      }

      throw error;
    }

    return NextResponse.json({
      review: generatedReview,
      provider: providerKey.provider_name,
      model: providerKey.default_model,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in generate-review API:', error);
    return NextResponse.json(
      { error: `Failed to generate review: ${errorMessage}` },
      { status: 500 }
    );
  }
}

async function generateWithProvider(
  providerKey: {
    provider: string;
    api_key: string;
    organization_id: string | null;
    base_url: string | null;
    default_model: string;
  },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  switch (providerKey.provider) {
    case 'openai':
      return generateWithOpenAI(providerKey, systemPrompt, userPrompt, maxLength);
    case 'anthropic':
      return generateWithAnthropic(providerKey, systemPrompt, userPrompt, maxLength);
    case 'google':
      return generateWithGoogle(providerKey, systemPrompt, userPrompt, maxLength);
    default:
      // Try OpenAI-compatible endpoint for custom providers
      return generateWithOpenAICompatible(providerKey, systemPrompt, userPrompt, maxLength);
  }
}

async function generateWithOpenAI(
  providerKey: { api_key: string; organization_id: string | null; default_model: string },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${providerKey.api_key}`,
  };

  if (providerKey.organization_id) {
    headers['OpenAI-Organization'] = providerKey.organization_id;
  }

  console.log('Calling OpenAI API with model:', providerKey.default_model);

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: providerKey.default_model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.min(Math.ceil(maxLength / 4), 2000), // Rough estimate: 4 chars per token
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error:', response.status, errorText);

    // Try to parse error message from OpenAI
    try {
      const errorJson = JSON.parse(errorText);
      const errorMessage = errorJson.error?.message || `OpenAI error: ${response.status}`;
      throw new Error(errorMessage);
    } catch {
      throw new Error(`OpenAI API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }
  }

  const data = await response.json();
  console.log('OpenAI response received, tokens used:', data.usage?.total_tokens);
  return data.choices[0].message.content;
}

async function generateWithAnthropic(
  providerKey: { api_key: string; default_model: string },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': providerKey.api_key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: providerKey.default_model,
      max_tokens: Math.min(Math.ceil(maxLength / 4), 4000),
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

async function generateWithGoogle(
  providerKey: { api_key: string; default_model: string },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  // Use stable model names directly - the -latest suffix doesn't work with v1beta API
  const modelMap: Record<string, string> = {
    'gemini-1.5-flash-latest': 'gemini-1.5-flash',
    'gemini-1.5-pro-latest': 'gemini-1.5-pro',
    'gemini-1.0-pro-latest': 'gemini-1.0-pro',
    'gemini-pro': 'gemini-1.0-pro',
    'gemini-ultra': 'gemini-1.0-pro',
  };

  const rawModel = providerKey.default_model || 'gemini-1.5-flash';
  // Strip -latest suffix if present, use stable model name
  const modelName = modelMap[rawModel] || rawModel.replace('-latest', '');

  console.log('Calling Google API with model:', modelName);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${providerKey.api_key}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: Math.min(Math.ceil(maxLength / 4), 2048),
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

async function generateWithOpenAICompatible(
  providerKey: { api_key: string; base_url: string | null; default_model: string },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  const baseUrl = providerKey.base_url || 'https://api.openai.com/v1';
  const url = baseUrl.endsWith('/chat/completions')
    ? baseUrl
    : `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerKey.api_key}`,
    },
    body: JSON.stringify({
      model: providerKey.default_model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.min(Math.ceil(maxLength / 4), 2000),
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}
