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
