-- Migration: Create AI Provider Keys table for BYOK (Bring Your Own Keys)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- AI_PROVIDER_KEYS TABLE (User-provided API keys)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_provider_keys (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Provider configuration
  provider              TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'google', 'azure_openai', 'custom')),
  provider_name         TEXT NOT NULL, -- Display name (e.g., "OpenAI", "Anthropic Claude")

  -- API Key (encrypted at rest by Supabase)
  api_key               TEXT NOT NULL,
  key_last_four         TEXT, -- Last 4 characters for display purposes (e.g., "sk-...3x9k")

  -- Optional: Organization ID (for OpenAI) or additional config
  organization_id       TEXT,
  base_url              TEXT, -- For custom/OpenAI-compatible endpoints

  -- Model configuration
  default_model         TEXT DEFAULT 'gpt-4', -- e.g., gpt-4, claude-3-opus-20240229
  available_models      TEXT[] DEFAULT ARRAY[]::TEXT[], -- Available models for this provider

  -- Status and validation
  is_active             BOOLEAN DEFAULT true,
  is_default            BOOLEAN DEFAULT false, -- Primary provider to use
  last_validated_at     TIMESTAMPTZ,
  validation_status     TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'valid', 'invalid', 'expired')),
  validation_error      TEXT, -- Error message if validation failed

  -- Usage tracking
  monthly_usage_count   INTEGER DEFAULT 0,
  monthly_usage_tokens  INTEGER DEFAULT 0,
  last_used_at          TIMESTAMPTZ,

  -- Metadata
  label                 TEXT, -- User-defined label (e.g., "Production Key", "Personal Account")
  notes                 TEXT, -- User notes about this key

  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one default provider per user (singleton pattern for default)
-- Note: In multi-tenant apps, you'd add a user_id column and scope the unique constraint
CREATE UNIQUE INDEX idx_ai_provider_keys_single_default ON ai_provider_keys (is_default) WHERE is_default = true;

-- Index for active providers lookup
CREATE INDEX idx_ai_provider_keys_active ON ai_provider_keys (is_active, provider);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ai_provider_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ai_provider_keys_trigger ON ai_provider_keys;
CREATE TRIGGER update_ai_provider_keys_trigger
  BEFORE UPDATE ON ai_provider_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_provider_keys_updated_at();

-- Trigger to reset monthly usage on month change (simplified)
CREATE OR REPLACE FUNCTION reset_monthly_usage_if_needed()
RETURNS TRIGGER AS $$
BEGIN
  -- If last_used_at is from a different month than now, reset counters
  IF OLD.last_used_at IS NULL OR 
     (EXTRACT(MONTH FROM OLD.last_used_at) != EXTRACT(MONTH FROM now()) OR
      EXTRACT(YEAR FROM OLD.last_used_at) != EXTRACT(YEAR FROM now())) THEN
    NEW.monthly_usage_count := 0;
    NEW.monthly_usage_tokens := 0;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS reset_monthly_usage_trigger ON ai_provider_keys;
CREATE TRIGGER reset_monthly_usage_trigger
  BEFORE UPDATE ON ai_provider_keys
  FOR EACH ROW
  WHEN (OLD.last_used_at IS DISTINCT FROM NEW.last_used_at)
  EXECUTE FUNCTION reset_monthly_usage_if_needed();

-- Enable RLS
ALTER TABLE ai_provider_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on ai_provider_keys" ON ai_provider_keys FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- VIEW: Active AI Providers (for quick lookup)
-- ============================================
CREATE OR REPLACE VIEW active_ai_providers AS
SELECT
  id,
  provider,
  provider_name,
  key_last_four,
  default_model,
  available_models,
  is_default,
  validation_status,
  label,
  monthly_usage_count,
  created_at,
  updated_at
FROM ai_provider_keys
WHERE is_active = true;

-- ============================================
-- INSERT DEFAULT DEMO DATA (Optional)
-- ============================================
-- Note: This creates a placeholder entry to show UI state
-- In production, users would add their own keys

-- ============================================
-- VERIFY TABLES WERE CREATED
-- ============================================
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ai_provider_keys')
ORDER BY table_name;

-- Show columns for the table
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'ai_provider_keys'
ORDER BY ordinal_position;
