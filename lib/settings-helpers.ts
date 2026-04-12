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
    description: 'Gemini Pro and Ultra models',
    keyPlaceholder: 'AIza...',
    keyPattern: '^AIza[ a-zA-Z0-9_-]+$',
    keyHelpUrl: 'https://makersuite.google.com/app/apikey',
    defaultModels: ['gemini-pro', 'gemini-ultra'],
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
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, label, monthly_usage_count, created_at, updated_at')
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
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, label, monthly_usage_count, created_at, updated_at')
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

export async function createAIProviderKey(
  input: CreateAIProviderKeyInput
): Promise<AIProviderKeyPublic | null> {
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
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, label, monthly_usage_count, created_at, updated_at')
    .single();

  if (error) {
    console.error('Error creating AI provider key:', error);
    return null;
  }

  return data;
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
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, label, monthly_usage_count, created_at, updated_at')
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
    .select('id, provider, provider_name, key_last_four, default_model, available_models, is_active, is_default, last_validated_at, validation_status, label, monthly_usage_count, created_at, updated_at')
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

export async function validateAIProviderKey(id: string): Promise<{ success: boolean; error?: string }> {
  const key = await getAIProviderKeyById(id);
  if (!key) {
    return { success: false, error: 'Key not found' };
  }

  try {
    // Perform validation based on provider
    const validationResult = await performKeyValidation(key);

    // Update the key with validation results
    await updateAIProviderKey(id, {
      validation_status: validationResult.success ? 'valid' : 'invalid',
      validation_error: validationResult.error || null,
    });

    return validationResult;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown validation error';
    await updateAIProviderKey(id, {
      validation_status: 'invalid',
      validation_error: errorMessage,
    });
    return { success: false, error: errorMessage };
  }
}

async function performKeyValidation(key: AIProviderKey): Promise<{ success: boolean; error?: string }> {
  // This would typically make a lightweight API call to validate the key
  // For now, we do basic format validation

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

  return { success: true };
}

export function maskApiKey(key: string): string {
  if (key.length <= 8) return '********';
  const firstFour = key.slice(0, 4);
  const lastFour = key.slice(-4);
  return `${firstFour}...${lastFour}`;
}
