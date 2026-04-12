import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This route handles API key validation server-side to avoid CORS issues

export async function POST(request: NextRequest) {
  try {
    const { keyId } = await request.json();

    if (!keyId) {
      return NextResponse.json({ success: false, error: 'Key ID is required' }, { status: 400 });
    }

    // Create a server-side Supabase client with service role key if available
    // Fall back to anon key for read operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the key from Supabase
    const { data: key, error } = await supabase
      .from('ai_provider_keys')
      .select('*')
      .eq('id', keyId)
      .single();

    if (error || !key) {
      return NextResponse.json({ success: false, error: 'Key not found' }, { status: 404 });
    }

    // Validate based on provider
    let validationResult: { success: boolean; error?: string };
    
    switch (key.provider) {
      case 'openai':
        validationResult = await validateOpenAI(key);
        break;
      case 'anthropic':
        validationResult = await validateAnthropic(key);
        break;
      case 'google':
        validationResult = await validateGoogle(key);
        break;
      case 'azure_openai':
        validationResult = await validateAzureOpenAI(key);
        break;
      default:
        validationResult = await validateCustom(key);
    }

    // Update the key with validation results
    await supabase
      .from('ai_provider_keys')
      .update({
        validation_status: validationResult.success ? 'valid' : 'invalid',
        validation_error: validationResult.error || null,
        validation_model: key.default_model,
        last_validated_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    return NextResponse.json({ ...validationResult, model: key.default_model });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

async function validateOpenAI(key: { api_key: string; default_model: string; organization_id?: string }): Promise<{ success: boolean; error?: string }> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key.api_key}`,
    'Content-Type': 'application/json',
  };

  if (key.organization_id) {
    headers['OpenAI-Organization'] = key.organization_id;
  }

  try {
    const model = key.default_model || 'gpt-3.5-turbo';
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        temperature: 0.1,
      }),
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    if (response.status === 404) {
      return { success: false, error: `Model "${model}" not available` };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.error?.message || `API error: ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

async function validateAnthropic(key: { api_key: string; default_model: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const model = key.default_model || 'claude-3-haiku-20240307';
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': key.api_key,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.1,
      }),
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    if (response.status === 404) {
      return { success: false, error: `Model "${model}" not available` };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.error?.message || `API error: ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

async function validateGoogle(key: { api_key: string; default_model: string }): Promise<{ success: boolean; error?: string }> {
  try {
    const model = key.default_model || 'gemini-pro';
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key.api_key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: { maxOutputTokens: 10, temperature: 0.1 },
        }),
      }
    );

    if (response.status === 400 || response.status === 403) {
      return { success: false, error: 'Invalid API key' };
    }
    if (response.status === 404) {
      return { success: false, error: `Model "${model}" not found` };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.error?.message || `API error: ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}

async function validateAzureOpenAI(key: { api_key: string; default_model: string; base_url?: string }): Promise<{ success: boolean; error?: string }> {
  const baseUrl = key.base_url || '';
  const apiVersion = '2024-02-01';

  try {
    const url = `${baseUrl}/openai/deployments?api-version=${apiVersion}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'api-key': key.api_key },
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }
    if (response.status === 404) {
      return { success: false, error: 'Resource not found. Check your Azure endpoint URL.' };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      return { success: false, error: errorData?.error?.message || `API error: ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error. Check your Azure endpoint URL.' };
  }
}

async function validateCustom(key: { api_key: string; default_model: string; base_url?: string }): Promise<{ success: boolean; error?: string }> {
  const baseUrl = key.base_url || 'https://api.openai.com/v1';

  try {
    const url = baseUrl.endsWith('/models') ? baseUrl : `${baseUrl}/models`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${key.api_key}` },
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key' };
    }
    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded' };
    }
    if (!response.ok) {
      return { success: false, error: `API error: ${response.status}` };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'Network error' };
  }
}
