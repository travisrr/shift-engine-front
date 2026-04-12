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

type ProviderKeyRecord = {
  id: string;
  provider: string;
  provider_name: string;
  api_key: string;
  organization_id: string | null;
  base_url: string | null;
  default_model: string;
  validation_status: 'pending' | 'valid' | 'invalid' | 'expired';
  validation_error: string | null;
  monthly_usage_count: number;
  is_default: boolean;
};

type UploadRow = {
  id: string;
  date: string;
};

type ReviewMetricRow = {
  upload_id: string;
  score: number | string | null;
  sales_hr: number | string | null;
  tips_hr: number | string | null;
  tip_pct: number | string | null;
  avg_check: number | string | null;
  guests_hr: number | string | null;
};

type ReviewDateRange = {
  startDate: string;
  endDate: string;
  periodText: string;
};

type ReviewMetrics = {
  startDate: string;
  endDate: string;
  firstShiftDate: string;
  lastShiftDate: string;
  shiftCount: number;
  averageScore: number | null;
  averageSalesHr: number | null;
  averageTipsHr: number | null;
  averageTipPct: number | null;
  averageAvgCheck: number | null;
  averageGuestsHr: number | null;
  averagePpa: number | null;
};

// Lazy initialization of Supabase client to avoid build-time errors
let supabaseClient: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
    }

    supabaseClient = createClient(supabaseUrl, supabaseKey);
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
        { error: 'Supabase server credentials are missing. Set NEXT_PUBLIC_SUPABASE_URL and either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY.' },
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

    let providerKey: ProviderKeyRecord | null = null;
    let providerError: unknown = null;

    if (body.providerKeyId) {
      const result = await supabase
        .from('ai_provider_keys')
        .select('*')
        .eq('is_active', true)
        .eq('id', body.providerKeyId)
        .single();
      providerKey = result.data;
      providerError = result.error;
    } else {
      const result = await supabase
        .from('ai_provider_keys')
        .select('*')
        .eq('is_active', true)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true });

      providerKey = selectPreferredProviderKey(result.data || []);
      providerError = result.error;
    }

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

    const reviewDateRange = getReviewDateRange(body);
    const metrics = await fetchReviewMetrics(
      supabase,
      body.employeeName,
      reviewDateRange.startDate,
      reviewDateRange.endDate
    );

    if (!metrics) {
      return NextResponse.json(
        {
          error: `No Toast metrics found for ${body.employeeName} between ${formatDateLabel(reviewDateRange.startDate)} and ${formatDateLabel(reviewDateRange.endDate)}.`,
        },
        { status: 404 }
      );
    }

    const metricSnapshot = buildMetricSnapshot(metrics);
    const promptMetricSnapshot = buildPromptMetricSnapshot(metrics);

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

    const systemPrompt = `You are an expert Restaurant General Manager writing a performance review for a restaurant ${body.jobTitle.toLowerCase()} based only on the provided Toast POS metrics.
${instructions ? `\nSaved company review guidance:\n${instructions}` : ''}
${aiSettings?.custom_prompt_template ? `\nCustom template: ${aiSettings.custom_prompt_template}` : ''}

Tone requirements: ${toneInstructions[effectiveTone] || toneInstructions.professional}
Focus areas to emphasize: ${focusAreasText}
${includeSuggestions ? 'Include 1-2 constructive suggestions for improvement.' : 'Do not include suggestions for improvement.'}
Purpose: We build community for our neighbors, growth for our teammates and a vision of success for our industry.
Values to weave in only when appropriate and supported by the data:
- We are positive and proactively manage our emotions.
- We are accountable and find a way.
- We treat each other with dignity, equity, and respect.
- We are creative, sharp, organized and safe.
- We grow personally and professionally through ongoing training and development.
- We over deliver on value.
- We are storytellers.
- We are fiscally healthy.

Non-negotiable rules:
- Use ONLY the provided metric snapshot. Do not invent any metrics, trends, comparisons, ranks, behaviors, dessert attach rate, voids, modifiers, rush patterns, or guest anecdotes.
- If a metric is not provided, do not mention it.
- Mention the company purpose and values naturally when they truly fit the data. Do not list all values or sound like a commercial.
- Keep the prose body to about ${maxLength} characters. The metric snapshot bullets are shown separately.
- Output exactly these sections with no intro or closing fluff:
Reality Check:
Impact:
Target:
- Reality Check should be 1-2 sentences.
- Impact should be 2-3 sentences and connect the data to their tips, the guest experience, and the restaurant's bottom line.
- Target should be exactly 1 sentence with one specific, data-driven goal for the next shift.`;

    const userPrompt = `Write a performance review for ${body.employeeName}, a ${body.jobTitle}, for ${reviewDateRange.periodText}.

This metric snapshot is factual and must anchor the review:
${promptMetricSnapshot}

The review should highlight their strengths in: ${focusAreasText}.

Do not make up any missing numbers or peer comparisons.`;

    // Generate the review using the appropriate provider
    let generatedReview: string;

    try {
      generatedReview = await generateWithProvider(providerKey, systemPrompt, userPrompt, Math.max(maxLength, 700));
      generatedReview = `${metricSnapshot}\n\n${generatedReview.trim()}`;

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

      const quotaError = getProviderQuotaErrorMessage(providerKey.provider_name, errorMessage);
      if (quotaError) {
        return NextResponse.json(
          { error: quotaError },
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

function getReviewDateRange(body: GenerateReviewRequest): ReviewDateRange {
  if (body.customDateRange?.start && body.customDateRange?.end) {
    return {
      startDate: body.customDateRange.start,
      endDate: body.customDateRange.end,
      periodText: `the period from ${formatDateLabel(body.customDateRange.start)} to ${formatDateLabel(body.customDateRange.end)}`,
    };
  }

  const endDate = new Date();
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);

  switch (body.timePeriod) {
    case 'last_30_days':
      startDate.setDate(startDate.getDate() - 29);
      break;
    case 'last_quarter':
      startDate.setDate(startDate.getDate() - 89);
      break;
    case 'last_6_months':
      startDate.setDate(startDate.getDate() - 179);
      break;
    default:
      startDate.setDate(startDate.getDate() - 364);
      break;
  }

  return {
    startDate: toDateInputValue(startDate),
    endDate: toDateInputValue(endDate),
    periodText:
      body.timePeriod === 'last_30_days'
        ? 'the past 30 days'
        : body.timePeriod === 'last_quarter'
          ? 'the last quarter'
          : body.timePeriod === 'last_6_months'
            ? 'the last 6 months'
            : 'the past year',
  };
}

async function fetchReviewMetrics(
  supabase: SupabaseClient,
  employeeName: string,
  startDate: string,
  endDate: string
): Promise<ReviewMetrics | null> {
  const { data: uploads, error: uploadsError } = await supabase
    .from('uploads')
    .select('id, date')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (uploadsError) {
    throw uploadsError;
  }

  const uploadRows = (uploads || []) as UploadRow[];
  if (uploadRows.length === 0) {
    return null;
  }

  const uploadIds = uploadRows.map((upload) => upload.id);
  const uploadDateById = new Map(uploadRows.map((upload) => [upload.id, upload.date]));

  const { data: metricRows, error: metricError } = await supabase
    .from('server_scores')
    .select('upload_id, score, sales_hr, tips_hr, tip_pct, avg_check, guests_hr')
    .ilike('server_name', employeeName)
    .in('upload_id', uploadIds);

  if (metricError) {
    throw metricError;
  }

  const rows = ((metricRows || []) as ReviewMetricRow[])
    .filter((row) => uploadDateById.has(row.upload_id))
    .sort((a, b) => {
      const dateA = uploadDateById.get(a.upload_id) || '';
      const dateB = uploadDateById.get(b.upload_id) || '';
      return dateA.localeCompare(dateB);
    });

  if (rows.length === 0) {
    return null;
  }

  const shiftDates = rows
    .map((row) => uploadDateById.get(row.upload_id))
    .filter((value): value is string => Boolean(value));

  return {
    startDate,
    endDate,
    firstShiftDate: shiftDates[0],
    lastShiftDate: shiftDates[shiftDates.length - 1],
    shiftCount: rows.length,
    averageScore: averageMetric(rows.map((row) => toNumber(row.score))),
    averageSalesHr: averageMetric(rows.map((row) => toNumber(row.sales_hr))),
    averageTipsHr: averageMetric(rows.map((row) => toNumber(row.tips_hr))),
    averageTipPct: averageMetric(rows.map((row) => toNumber(row.tip_pct))),
    averageAvgCheck: averageMetric(rows.map((row) => toNumber(row.avg_check))),
    averageGuestsHr: averageMetric(rows.map((row) => toNumber(row.guests_hr))),
    averagePpa: averageMetric(rows.map((row) => getDerivedPpa(row))),
  };
}

function buildMetricSnapshot(metrics: ReviewMetrics): string {
  const lines = [
    'Metric Snapshot',
    `- Review window: ${formatDateLabel(metrics.startDate)} to ${formatDateLabel(metrics.endDate)}`,
    `- Upload days with data: ${metrics.shiftCount}`,
    `- Actual data dates: ${formatDateLabel(metrics.firstShiftDate)} to ${formatDateLabel(metrics.lastShiftDate)}`,
  ];

  const metricLines = [
    formatMetricLine('Average score', metrics.averageScore, 'number', 0),
    formatMetricLine('Average sales/hr', metrics.averageSalesHr, 'currency', 2),
    formatMetricLine('Average tips/hr', metrics.averageTipsHr, 'currency', 2),
    formatMetricLine('Average tip %', metrics.averageTipPct, 'percentage', 1),
    formatMetricLine('Average check', metrics.averageAvgCheck, 'currency', 2),
    formatMetricLine('Average guests/hr', metrics.averageGuestsHr, 'number', 1),
    formatMetricLine('Average PPA', metrics.averagePpa, 'currency', 2),
  ].filter(Boolean);

  return [...lines, ...metricLines].join('\n');
}

function buildPromptMetricSnapshot(metrics: ReviewMetrics): string {
  return [
    `- Review window: ${formatDateLabel(metrics.startDate)} to ${formatDateLabel(metrics.endDate)}`,
    `- Upload days with data: ${metrics.shiftCount}`,
    `- Actual data dates: ${formatDateLabel(metrics.firstShiftDate)} to ${formatDateLabel(metrics.lastShiftDate)}`,
    formatMetricLine('Average score', metrics.averageScore, 'number', 0),
    formatMetricLine('Average sales/hr', metrics.averageSalesHr, 'currency', 2),
    formatMetricLine('Average tips/hr', metrics.averageTipsHr, 'currency', 2),
    formatMetricLine('Average tip %', metrics.averageTipPct, 'percentage', 1),
    formatMetricLine('Average check', metrics.averageAvgCheck, 'currency', 2),
    formatMetricLine('Average guests/hr', metrics.averageGuestsHr, 'number', 1),
    formatMetricLine('Average PPA', metrics.averagePpa, 'currency', 2),
  ]
    .filter(Boolean)
    .join('\n');
}

function formatMetricLine(
  label: string,
  value: number | null,
  format: 'currency' | 'percentage' | 'number',
  decimals: number
): string | null {
  if (value === null) {
    return null;
  }

  return `- ${label}: ${formatMetricValue(value, format, decimals)}`;
}

function formatMetricValue(
  value: number,
  format: 'currency' | 'percentage' | 'number',
  decimals: number
): string {
  if (format === 'currency') {
    return `$${value.toFixed(decimals)}`;
  }

  if (format === 'percentage') {
    return `${value.toFixed(decimals)}%`;
  }

  return value.toFixed(decimals);
}

function averageMetric(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null && Number.isFinite(value));
  if (numbers.length === 0) {
    return null;
  }

  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function toNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getDerivedPpa(row: Pick<ReviewMetricRow, 'sales_hr' | 'guests_hr'>): number | null {
  const salesHr = toNumber(row.sales_hr);
  const guestsHr = toNumber(row.guests_hr);

  if (salesHr === null || guestsHr === null || guestsHr <= 0) {
    return null;
  }

  return salesHr / guestsHr;
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function selectPreferredProviderKey(keys: ProviderKeyRecord[]): ProviderKeyRecord | null {
  if (keys.length === 0) {
    return null;
  }

  const validDefault = keys.find((key) => key.is_default && key.validation_status === 'valid');
  if (validDefault) return validDefault;

  const validActive = keys.find((key) => key.validation_status === 'valid');
  if (validActive) return validActive;

  const anyDefault = keys.find((key) => key.is_default);
  return anyDefault || keys[0] || null;
}

function getProviderQuotaErrorMessage(providerName: string, errorMessage: string): string | null {
  const normalized = errorMessage.toLowerCase();

  if (
    normalized.includes('insufficient balance') ||
    normalized.includes('exceeded_current_quota_error') ||
    normalized.includes('check your plan and billing details') ||
    normalized.includes('suspended due to insufficient balance')
  ) {
    return `${providerName} billing issue: recharge the account or check the provider plan and billing details.`;
  }

  if (normalized.includes('429') || normalized.includes('rate limit')) {
    return 'Rate limit exceeded. Please try again in a moment.';
  }

  return null;
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
    case 'moonshot':
      return generateWithMoonshot(providerKey, systemPrompt, userPrompt, maxLength);
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
  const availableModels = await getAvailableGoogleModels(providerKey.api_key);
  const candidateModels = getOrderedGoogleModels(providerKey.default_model, availableModels);

  if (candidateModels.length === 0) {
    throw new Error('No Google models with generateContent support are available for this key.');
  }
  let lastError = '';

  for (const modelName of candidateModels) {
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

    if (response.ok) {
      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    }

    lastError = await response.text();

    if (response.status === 401 || response.status === 403 || response.status === 429) {
      throw new Error(`Google API error: ${response.status} ${lastError}`);
    }
  }

  throw new Error(`Google API error: no compatible model succeeded. Tried ${candidateModels.slice(0, 5).join(', ')}. Last error: ${lastError}`);
}

async function getAvailableGoogleModels(apiKey: string): Promise<string[]> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    { method: 'GET' }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google models list error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const models = Array.isArray(data.models) ? data.models : [];

  return models
    .filter((model: { supportedGenerationMethods?: string[] }) => Array.isArray(model.supportedGenerationMethods) && model.supportedGenerationMethods.includes('generateContent'))
    .map((model: { name?: string }) => String(model.name || '').replace(/^models\//, ''))
    .filter(Boolean);
}

function getOrderedGoogleModels(preferredModel: string | null | undefined, availableModels: string[]): string[] {
  const ordered: string[] = [];

  if (preferredModel && availableModels.includes(preferredModel)) {
    ordered.push(preferredModel);
  }

  const preferredFallbacks = [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ];

  for (const candidate of preferredFallbacks) {
    if (availableModels.includes(candidate) && !ordered.includes(candidate)) {
      ordered.push(candidate);
    }
  }

  for (const candidate of availableModels) {
    if (!ordered.includes(candidate)) {
      ordered.push(candidate);
    }
  }

  return ordered;
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

async function generateWithMoonshot(
  providerKey: { api_key: string; base_url: string | null; default_model: string },
  systemPrompt: string,
  userPrompt: string,
  maxLength: number
): Promise<string> {
  const response = await fetch(`${(providerKey.base_url || 'https://api.moonshot.ai/v1').replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${providerKey.api_key}`,
    },
    body: JSON.stringify({
      model: providerKey.default_model || 'kimi-k2.5',
      thinking: { type: 'disabled' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: Math.min(Math.max(Math.ceil(maxLength / 4), 512), 2000),
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;

  if (typeof content === 'string' && content.trim()) {
    return content.trim();
  }

  throw new Error('Moonshot returned an empty review.');
}
