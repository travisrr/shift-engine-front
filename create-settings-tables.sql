-- Migration: Create settings tables for persistent data storage
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- 1. COMPANY_SETTINGS TABLE (General company details)
-- ============================================
CREATE TABLE IF NOT EXISTS company_settings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name    TEXT DEFAULT 'Shift Engine Restaurant Group',
  contact_email   TEXT DEFAULT 'admin@shiftengine.io',
  phone_number    TEXT DEFAULT '(555) 123-4567',
  address         TEXT DEFAULT '123 Main St, Suite 100',
  -- Billing-related fields
  subscription_plan    TEXT DEFAULT 'All Access',
  subscription_status  TEXT DEFAULT 'Active' CHECK (subscription_status IN ('Active', 'Canceled', 'Past Due', 'Trialing')),
  subscription_price   NUMERIC(10,2) DEFAULT 75.00,
  billing_cycle        TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  stripe_customer_id   TEXT,
  stripe_subscription_id TEXT,
  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one row exists (singleton pattern)
-- Using a fixed constraint to prevent multiple company settings rows
ALTER TABLE company_settings 
  ADD CONSTRAINT company_settings_single_row 
  CHECK (id = '00000000-0000-0000-0000-000000000001'::UUID);

-- Insert default row if table is empty
INSERT INTO company_settings (id)
SELECT '00000000-0000-0000-0000-000000000001'::UUID
WHERE NOT EXISTS (SELECT 1 FROM company_settings);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_company_settings_trigger ON company_settings;
CREATE TRIGGER update_company_settings_trigger
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on company_settings" ON company_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. LOCATIONS TABLE (Restaurant locations)
-- ============================================
CREATE TABLE IF NOT EXISTS locations (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  address         TEXT NOT NULL,
  city            TEXT,
  state           TEXT,
  zip_code        TEXT,
  phone           TEXT,
  manager_name    TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on locations" ON locations FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data if table is empty
INSERT INTO locations (name, address, city, state)
SELECT 'Downtown Flagship', '123 Main St', 'Downtown', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM locations);

INSERT INTO locations (name, address, city, state)
SELECT 'Westside Location', '456 West Ave', 'Westside', 'CA'
WHERE NOT EXISTS (SELECT 1 FROM locations WHERE name = 'Westside Location');

-- ============================================
-- 3. AI_SETTINGS TABLE (AI Assistant preferences)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_settings (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_instructions       TEXT DEFAULT 'Always maintain a professional but encouraging tone. Highlight upsell metrics before discussing table turn speeds. Do not use corporate jargon.',
  review_tone               TEXT DEFAULT 'professional' CHECK (review_tone IN ('professional', 'friendly', 'direct', 'detailed')),
  focus_areas               TEXT[] DEFAULT ARRAY['upsell_metrics', 'table_turn_speed', 'guest_satisfaction'],
  custom_prompt_template    TEXT,
  ai_model                  TEXT DEFAULT 'gpt-4',
  max_review_length         INTEGER DEFAULT 500,
  include_suggestions       BOOLEAN DEFAULT true,
  created_at                TIMESTAMPTZ DEFAULT now(),
  updated_at                TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one row exists (singleton pattern)
ALTER TABLE ai_settings 
  ADD CONSTRAINT ai_settings_single_row 
  CHECK (id = '00000000-0000-0000-0000-000000000002'::UUID);

-- Insert default row if table is empty
INSERT INTO ai_settings (id)
SELECT '00000000-0000-0000-0000-000000000002'::UUID
WHERE NOT EXISTS (SELECT 1 FROM ai_settings);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_ai_settings_updated_at ON ai_settings;
CREATE TRIGGER update_ai_settings_updated_at
  BEFORE UPDATE ON ai_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE ai_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ai_settings" ON ai_settings FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. PAYMENT_METHODS TABLE (Stored payment methods)
-- ============================================
CREATE TABLE IF NOT EXISTS payment_methods (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand      TEXT,
  card_last4      TEXT,
  card_exp_month  INTEGER,
  card_exp_year   INTEGER,
  is_default      BOOLEAN DEFAULT false,
  billing_email   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_payment_methods_updated_at ON payment_methods;
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on payment_methods" ON payment_methods FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 5. INVOICES TABLE (Billing history)
-- ============================================
CREATE TABLE IF NOT EXISTS invoices (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_invoice_id TEXT UNIQUE,
  amount_due      NUMERIC(10,2) NOT NULL,
  amount_paid     NUMERIC(10,2) DEFAULT 0,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'open', 'paid', 'uncollectible', 'void')),
  description     TEXT,
  invoice_date    DATE NOT NULL,
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  invoice_pdf_url TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VERIFY TABLES WERE CREATED
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('company_settings', 'locations', 'ai_settings', 'payment_methods', 'invoices')
ORDER BY table_name;

-- Show columns for each table
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('company_settings', 'locations', 'ai_settings', 'payment_methods', 'invoices')
ORDER BY table_name, ordinal_position;
