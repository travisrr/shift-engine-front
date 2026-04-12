import { supabase } from './supabase';

// ============================================
// COMPANY SETTINGS HELPERS
// ============================================

export interface CompanySettings {
  id: string;
  company_name: string;
  contact_email: string;
  phone_number: string;
  address: string;
  subscription_plan: string;
  subscription_status: 'Active' | 'Canceled' | 'Past Due' | 'Trialing';
  subscription_price: number;
  billing_cycle: 'monthly' | 'annual';
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export async function getCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }

  return data;
}

export async function updateCompanySettings(
  settings: Partial<Omit<CompanySettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .update(settings)
    .eq('id', '00000000-0000-0000-0000-000000000001')
    .select()
    .single();

  if (error) {
    console.error('Error updating company settings:', error);
    return null;
  }

  return data;
}

// ============================================
// LOCATIONS HELPERS
// ============================================

export interface Location {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function getLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching locations:', error);
    return [];
  }

  return data || [];
}

export async function getActiveLocations(): Promise<Location[]> {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active locations:', error);
    return [];
  }

  return data || [];
}

export async function createLocation(
  location: Omit<Location, 'id' | 'created_at' | 'updated_at'>
): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .insert(location)
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    return null;
  }

  return data;
}

export async function updateLocation(
  id: string,
  location: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>
): Promise<Location | null> {
  const { data, error } = await supabase
    .from('locations')
    .update(location)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating location:', error);
    return null;
  }

  return data;
}

export async function deleteLocation(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting location:', error);
    return false;
  }

  return true;
}

// ============================================
// AI SETTINGS HELPERS
// ============================================

export interface AISettings {
  id: string;
  review_instructions: string;
  review_tone: 'professional' | 'friendly' | 'direct' | 'detailed';
  focus_areas: string[];
  custom_prompt_template: string | null;
  ai_model: string;
  max_review_length: number;
  include_suggestions: boolean;
  created_at: string;
  updated_at: string;
}

export async function getAISettings(): Promise<AISettings | null> {
  const { data, error } = await supabase
    .from('ai_settings')
    .select('*')
    .single();

  if (error) {
    console.error('Error fetching AI settings:', error);
    return null;
  }

  return data;
}

export async function updateAISettings(
  settings: Partial<Omit<AISettings, 'id' | 'created_at' | 'updated_at'>>
): Promise<AISettings | null> {
  const { data, error } = await supabase
    .from('ai_settings')
    .update(settings)
    .eq('id', '00000000-0000-0000-0000-000000000002')
    .select()
    .single();

  if (error) {
    console.error('Error updating AI settings:', error);
    return null;
  }

  return data;
}

// ============================================
// PAYMENT METHODS HELPERS
// ============================================

export interface PaymentMethod {
  id: string;
  stripe_payment_method_id: string;
  card_brand: string | null;
  card_last4: string | null;
  card_exp_month: number | null;
  card_exp_year: number | null;
  is_default: boolean;
  billing_email: string | null;
  created_at: string;
  updated_at: string;
}

export async function getPaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }

  return data || [];
}

export async function getDefaultPaymentMethod(): Promise<PaymentMethod | null> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_default', true)
    .single();

  if (error) {
    console.error('Error fetching default payment method:', error);
    return null;
  }

  return data;
}

export async function createPaymentMethod(
  paymentMethod: Omit<PaymentMethod, 'id' | 'created_at' | 'updated_at'>
): Promise<PaymentMethod | null> {
  const { data, error } = await supabase
    .from('payment_methods')
    .insert(paymentMethod)
    .select()
    .single();

  if (error) {
    console.error('Error creating payment method:', error);
    return null;
  }

  return data;
}

export async function setDefaultPaymentMethod(id: string): Promise<boolean> {
  // First, unset all defaults
  const { error: unsetError } = await supabase
    .from('payment_methods')
    .update({ is_default: false })
    .neq('id', id);

  if (unsetError) {
    console.error('Error unsetting default payment methods:', unsetError);
    return false;
  }

  // Then set the new default
  const { error } = await supabase
    .from('payment_methods')
    .update({ is_default: true })
    .eq('id', id);

  if (error) {
    console.error('Error setting default payment method:', error);
    return false;
  }

  return true;
}

export async function deletePaymentMethod(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('payment_methods')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }

  return true;
}

// ============================================
// INVOICES HELPERS
// ============================================

export interface Invoice {
  id: string;
  stripe_invoice_id: string | null;
  amount_due: number;
  amount_paid: number;
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void';
  description: string | null;
  invoice_date: string;
  due_date: string | null;
  paid_at: string | null;
  invoice_pdf_url: string | null;
  created_at: string;
}

export async function getInvoices(limit: number = 50): Promise<Invoice[]> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('invoice_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }

  return data || [];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching invoice:', error);
    return null;
  }

  return data;
}

// ============================================
// AI PROVIDER KEYS HELPERS (BYOK)
// ============================================

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'azure_openai' | 'custom';

export interface AIProviderKey {
  id: string;
  provider: AIProvider;
  provider_name: string;
  api_key: string;
  key_last_four: string | null;
  organization_id: string | null;
  base_url: string | null;
  default_model: string;
  available_models: string[];
  is_active: boolean;
  is_default: boolean;
  last_validated_at: string | null;
  validation_status: 'pending' | 'valid' | 'invalid' | 'expired';
  validation_error: string | null;
  validation_model: string | null;
  monthly_usage_count: number;
  monthly_usage_tokens: number;
  last_used_at: string | null;
  label: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIProviderKeyPublic {
  id: string;
  provider: AIProvider;
  provider_name: string;
  key_last_four: string | null;
  default_model: string;
  available_models: string[];
  is_active: boolean;
  is_default: boolean;
  last_validated_at: string | null;
  validation_status: 'pending' | 'valid' | 'invalid' | 'expired';
  validation_error: string | null;
  validation_model: string | null;
  label: string | null;
  monthly_usage_count: number;
  created_at: string;
  updated_at: string;
}

// Provider metadata for UI
export const AI_PROVIDER_METADATA: Record<AIProvider, {
  name: string;
  description: string;
  keyPlaceholder: string;
  keyPattern: string;
  keyHelpUrl: string;
  defaultModels: string[];
  supportsOrganization: boolean;
  supportsCustomBaseUrl: boolean;
}> = {
  openai: {
    name: 'OpenAI',
    description: 'GPT-4, GPT-4 Turbo, and GPT-3.5 Turbo models',
    keyPlaceholder: 'sk-...',
    keyPattern: '^sk-[a-zA-Z0-9]{48}$',
    keyHelpUrl: 'https://platform.openai.com/api-keys',
    defaultModels: ['gpt-4', 'gpt-4-turbo-preview', 'gpt-3.5-turbo'],
    supportsOrganization: true,
    supportsCustomBaseUrl: false,
  },
  anthropic: {
    name: 'Anthropic Claude',
    description: 'Claude 3 Opus, Sonnet, and Haiku models',
    keyPlaceholder: 'sk-ant-...',
    keyPattern: '^sk-ant-[a-zA-Z0-9_-]+$',
    keyHelpUrl: 'https://console.anthropic.com/settings/keys',
    defaultModels: ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
    supportsOrganization: false,
    supportsCustomBaseUrl: false,
  },
  google: {
    name: 'Google Gemini',
    description: 'Gemini Pro and Flash models',
    keyPlaceholder: 'AIza...',
    keyPattern: '^AIza[ a-zA-Z0-9_-]+$',
    keyHelpUrl: 'https://makersuite.google.com/app/apikey',
    defaultModels: ['gemini-pro', 'gemini-1.0-pro-latest', 'gemini-1.5-flash-latest'],
    supportsOrganization: false,
    supportsCustomBaseUrl: false,
  },
  azure_openai: {
    name: 'Azure OpenAI',
    description: 'Enterprise OpenAI through Azure',
    keyPlaceholder: 'https://<resource>.openai.azure.com/',
    keyPattern: '^https://.+\\.openai\\.azure\\.com/.*$',
    keyHelpUrl: 'https://portal.azure.com/#view/Microsoft_Azure_ProjectOxford/CognitiveServicesHub/~/OpenAI',
    defaultModels: ['gpt-4', 'gpt-4-32k', 'gpt-35-turbo'],
    supportsOrganization: false,
    supportsCustomBaseUrl: true,
  },
  custom: {
    name: 'Custom Provider',
    description: 'Any OpenAI-compatible API endpoint',
    keyPlaceholder: 'your-api-key',
    keyPattern: '.*',
    keyHelpUrl: '',
    defaultModels: ['default'],
    supportsOrganization: false,
    supportsCustomBaseUrl: true,
  },
};

export async function getAIProviderKeys(): Promise<AIProviderKeyPublic[]> {
  const { data, error } = await supabase
    .from('ai_provider_keys')
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, validation_error, validation_model, label, monthly_usage_count, created_at, updated_at')
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching AI provider keys:', error);
    return [];
  }

  return data || [];
}

export async function getDefaultAIProviderKey(): Promise<AIProviderKeyPublic | null> {
  const { data, error } = await supabase
    .from('ai_provider_keys')
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, validation_error, validation_model, label, monthly_usage_count, created_at, updated_at')
    .eq('is_default', true)
    .eq('is_active', true)
    .single();

  if (error) {
    // No default key set is not an error
    if (error.code === 'PGRST116') return null;
    console.error('Error fetching default AI provider key:', error);
    return null;
  }

  return data;
}

export async function getAIProviderKeyById(id: string): Promise<AIProviderKey | null> {
  const { data, error } = await supabase
    .from('ai_provider_keys')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching AI provider key:', error);
    return null;
  }

  return data;
}

export interface CreateAIProviderKeyInput {
  provider: AIProvider;
  api_key: string;
  label?: string;
  notes?: string;
  organization_id?: string;
  base_url?: string;
  default_model?: string;
  is_default?: boolean;
}

export type CreateAIProviderKeyResult =
  | { success: true; data: AIProviderKeyPublic }
  | { success: false; error: string };

export async function createAIProviderKey(
  input: CreateAIProviderKeyInput
): Promise<CreateAIProviderKeyResult> {
  const metadata = AI_PROVIDER_METADATA[input.provider];

  // Extract last 4 characters of key for display (safely)
  const keyLastFour = input.api_key.length > 4
    ? `...${input.api_key.slice(-4)}`
    : '****';

  const { data, error } = await supabase
    .from('ai_provider_keys')
    .insert({
      provider: input.provider,
      provider_name: metadata.name,
      api_key: input.api_key,
      key_last_four: keyLastFour,
      label: input.label || metadata.name,
      notes: input.notes || null,
      organization_id: input.organization_id || null,
      base_url: input.base_url || null,
      default_model: input.default_model || metadata.defaultModels[0],
      available_models: metadata.defaultModels,
      is_default: input.is_default ?? false,
      validation_status: 'pending',
    })
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, validation_error, validation_model, label, monthly_usage_count, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating AI provider key:', error);
    // Provide a helpful error message based on the error type
    let errorMessage = 'Failed to save API key. Please try again.';
    if (error.code === '42P01') {
      errorMessage = 'Database table not found. Please run the SQL migration to create the ai_provider_keys table.';
    } else if (error.code === '42501') {
      errorMessage = 'Permission denied. Please check your Supabase RLS policies.';
    } else if (error.code === '23505') {
      errorMessage = 'You already have a default API key. Please uncheck "Set as default" or remove your existing default key first.';
    } else if (error.code === '23514' || error.code === '23502') {
      errorMessage = `Validation failed: ${error.message}`;
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { success: false, error: errorMessage };
  }

  return { success: true, data };
}

export interface UpdateAIProviderKeyInput {
  label?: string;
  notes?: string;
  api_key?: string;
  organization_id?: string | null;
  base_url?: string | null;
  default_model?: string;
  is_active?: boolean;
  is_default?: boolean;
  validation_status?: 'pending' | 'valid' | 'invalid' | 'expired';
  validation_error?: string | null;
  validation_model?: string | null;
  last_validated_at?: string;
}

export async function updateAIProviderKey(
  id: string,
  input: UpdateAIProviderKeyInput
): Promise<AIProviderKeyPublic | null> {
  const updates: Record<string, unknown> = { ...input };

  // If updating API key, also update key_last_four
  if (input.api_key) {
    updates.key_last_four = input.api_key.length > 4
      ? `...${input.api_key.slice(-4)}`
      : '****';
  }

  // If setting as default, we need to unset others first (handled by trigger or manually)
  if (input.is_default === true) {
    await unsetAllDefaultProviderKeys(id);
  }

  const { data, error } = await supabase
    .from('ai_provider_keys')
    .update(updates)
    .eq('id', id)
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, validation_error, validation_model, label, monthly_usage_count, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error updating AI provider key:', error);
    return null;
  }

  return data;
}

async function unsetAllDefaultProviderKeys(exceptId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_provider_keys')
    .update({ is_default: false })
    .neq('id', exceptId);

  if (error) {
    console.error('Error unsetting default provider keys:', error);
    return false;
  }

  return true;
}

export async function deleteAIProviderKey(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_provider_keys')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting AI provider key:', error);
    return false;
  }

  return true;
}

export async function setDefaultAIProviderKey(id: string): Promise<AIProviderKeyPublic | null> {
  // First unset all others
  await unsetAllDefaultProviderKeys(id);

  // Then set this one as default
  const { data, error } = await supabase
    .from('ai_provider_keys')
    .update({ is_default: true })
    .eq('id', id)
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, validation_error, validation_model, label, monthly_usage_count, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error setting default AI provider key:', error);
    return null;
  }

  return data;
}

// ============================================
// AI KEY VALIDATION HELPERS
// ============================================

export async function validateAIProviderKey(id: string): Promise<{ success: boolean; error?: string; model?: string }> {
  const key = await getAIProviderKeyById(id);
  if (!key) {
    return { success: false, error: 'Key not found' };
  }

  // Use the default model for validation
  const validationModel = key.default_model;

  try {
    // Perform validation based on provider
    const validationResult = await performKeyValidation(key);

    // Update the key with validation results
    await updateAIProviderKey(id, {
      validation_status: validationResult.success ? 'valid' : 'invalid',
      validation_error: validationResult.error || null,
      validation_model: validationModel,
      last_validated_at: new Date().toISOString(),
    });

    return { ...validationResult, model: validationModel };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
    await updateAIProviderKey(id, {
      validation_status: 'invalid',
      validation_error: errorMessage,
      validation_model: validationModel,
      last_validated_at: new Date().toISOString(),
    });
    return { success: false, error: errorMessage, model: validationModel };
  }
}

async function performKeyValidation(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  // First do basic format validation
  switch (key.provider) {
    case 'openai':
      if (!key.api_key.startsWith('sk-') || key.api_key.length < 20) {
        return { success: false, error: 'Invalid OpenAI key format. Should start with "sk-"' };
      }
      break;
    case 'anthropic':
      if (!key.api_key.startsWith('sk-ant-')) {
        return { success: false, error: 'Invalid Anthropic key format. Should start with "sk-ant-"' };
      }
      break;
    case 'google':
      if (!key.api_key.startsWith('AIza')) {
        return { success: false, error: 'Invalid Google API key format. Should start with "AIza"' };
      }
      break;
    case 'azure_openai':
      if (!key.base_url || !key.base_url.includes('openai.azure.com')) {
        return { success: false, error: 'Invalid Azure OpenAI base URL' };
      }
      break;
    default:
      // Custom provider - minimal validation
      if (key.api_key.length < 8) {
        return { success: false, error: 'API key seems too short' };
      }
  }

  // Now perform actual API test
  try {
    const testResult = await testApiKey(key);
    return testResult;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error during validation';
    return { success: false, error: errorMessage };
  }
}

async function testApiKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  switch (key.provider) {
    case 'openai':
      return testOpenAIKey(key);
    case 'anthropic':
      return testAnthropicKey(key);
    case 'google':
      return testGoogleKey(key);
    case 'azure_openai':
      return testAzureOpenAIKey(key);
    default:
      return testCustomProviderKey(key);
  }
}

async function testOpenAIKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${key.api_key}`,
    'Content-Type': 'application/json',
  };

  if (key.organization_id) {
    headers['OpenAI-Organization'] = key.organization_id;
  }

  try {
    // Test with an actual completion call to verify the model works
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
      return { success: false, error: 'Invalid API key. Please check your key and try again.' };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
    }

    if (response.status === 404) {
      const errorData = await response.json().catch(() => null);
      const modelError = errorData?.error?.message || '';
      if (modelError.includes('model') || modelError.includes('does not exist')) {
        return { success: false, error: `Model "${model}" not available. Please select a different model in settings.` };
      }
      return { success: false, error: `Model error: ${modelError}` };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMsg };
    }

    // Successfully generated content
    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}

async function testAnthropicKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  try {
    // Test with an actual message call to verify the model works
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
      return { success: false, error: 'Invalid API key. Please check your key and try again.' };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
    }

    if (response.status === 404) {
      const errorData = await response.json().catch(() => null);
      const modelError = errorData?.error?.message || '';
      if (modelError.includes('model') || modelError.includes('not found')) {
        return { success: false, error: `Model "${model}" not available. Please select a different model in settings.` };
      }
      return { success: false, error: `Model error: ${modelError}` };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}

async function testGoogleKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  try {
    // Map model names to working API names
    const modelMap: Record<string, string> = {
      'gemini-pro': 'gemini-pro',
      'gemini-1.0-pro': 'gemini-pro',
      'gemini-1.0-pro-latest': 'gemini-1.0-pro-latest',
      'gemini-1.5-flash': 'gemini-1.5-flash-001',
      'gemini-1.5-flash-latest': 'gemini-1.5-flash-001',
      'gemini-1.5-pro': 'gemini-1.5-pro-001',
      'gemini-1.5-pro-latest': 'gemini-1.5-pro-001',
    };

    const rawModel = key.default_model || 'gemini-pro';
    const modelName = modelMap[rawModel] || 'gemini-pro';

    // Test with an actual generateContent call to verify the model works
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key.api_key}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: 'Hello' }],
            },
          ],
          generationConfig: {
            maxOutputTokens: 10,
            temperature: 0.1,
          },
        }),
      }
    );

    if (response.status === 400 || response.status === 403) {
      const errorData = await response.json().catch(() => null);
      if (errorData?.error?.message?.includes('API key not valid')) {
        return { success: false, error: 'Invalid API key. Please check your key and try again.' };
      }
      return { success: false, error: errorData?.error?.message || 'API key validation failed.' };
    }

    if (response.status === 404) {
      const errorData = await response.json().catch(() => null);
      const modelError = errorData?.error?.message || '';
      if (modelError.includes('not found') || modelError.includes('is not found')) {
        return { success: false, error: `Model "${rawModel}" (${modelName}) not found or not available. Please select a different model in settings.` };
      }
      return { success: false, error: `Model error: ${modelError}` };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection and try again.' };
  }
}

async function testAzureOpenAIKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  const baseUrl = key.base_url || '';
  const apiVersion = '2024-02-01';

  try {
    // Extract resource name from base URL and test with deployments endpoint
    const url = `${baseUrl}/openai/deployments?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'api-key': key.api_key,
      },
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key. Please check your key and try again.' };
    }

    if (response.status === 404) {
      return { success: false, error: 'Resource not found. Please check your Azure OpenAI endpoint URL.' };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection and Azure endpoint URL.' };
  }
}

async function testCustomProviderKey(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  const baseUrl = key.base_url || 'https://api.openai.com/v1';

  try {
    // Test with models endpoint (OpenAI-compatible)
    const url = baseUrl.endsWith('/models')
      ? baseUrl
      : `${baseUrl.replace(/\/$/, '')}/models`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${key.api_key}`,
      },
    });

    if (response.status === 401) {
      return { success: false, error: 'Invalid API key. Please check your key and try again.' };
    }

    if (response.status === 429) {
      return { success: false, error: 'Rate limit exceeded. Please wait a moment and try again.' };
    }

    if (!response.ok) {
      // For custom providers, be more lenient - some may not have a /models endpoint
      // If we get a 404, the key might still be valid, just the endpoint is different
      if (response.status === 404) {
        return { success: true };
      }
      const errorData = await response.json().catch(() => null);
      const errorMsg = errorData?.error?.message || `API error: ${response.status}`;
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Network error. Please check your connection and base URL.' };
  }
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '********';
  const firstFour = key.slice(0, 4);
  const lastFour = key.slice(-4);
  return `${firstFour}...${lastFour}`;
}

// ============================================
// ALLOWED USERS HELPERS (Software users - GMs, Assistant GMs, etc.)
// ============================================

export type AllowedUserRole = 'General Manager' | 'Assistant General Manager' | 'Manager' | 'Supervisor' | 'Owner' | 'Admin';

export interface AllowedUser {
  id: string;
  full_name: string;
  email: string;
  role: AllowedUserRole;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const ALLOWED_USER_ROLES: AllowedUserRole[] = [
  'General Manager',
  'Assistant General Manager',
  'Manager',
  'Supervisor',
  'Owner',
  'Admin',
];

export async function getAllowedUsers(): Promise<AllowedUser[]> {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching allowed users:', error);
    return [];
  }

  return data || [];
}

export async function getActiveAllowedUsers(): Promise<AllowedUser[]> {
  const { data, error } = await supabase
    .from('allowed_users')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching active allowed users:', error);
    return [];
  }

  return data || [];
}

export async function createAllowedUser(
  user: Omit<AllowedUser, 'id' | 'created_at' | 'updated_at'>
): Promise<AllowedUser | null> {
  const { data, error } = await supabase
    .from('allowed_users')
    .insert(user)
    .select()
    .single();

  if (error) {
    console.error('Error creating allowed user:', error);
    return null;
  }

  return data;
}

export async function updateAllowedUser(
  id: string,
  user: Partial<Omit<AllowedUser, 'id' | 'created_at' | 'updated_at'>>
): Promise<AllowedUser | null> {
  const { data, error } = await supabase
    .from('allowed_users')
    .update(user)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating allowed user:', error);
    return null;
  }

  return data;
}

export async function deleteAllowedUser(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('allowed_users')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting allowed user:', error);
    return false;
  }

  return true;
}
