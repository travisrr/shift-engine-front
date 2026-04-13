-- Migration: Add MVP multi-tenant foundation for uploads
-- Run this after the existing table creation scripts.

-- ============================================
-- 1. ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS accounts (
  id          UUID PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION update_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_accounts_updated_at_trigger ON accounts;
CREATE TRIGGER update_accounts_updated_at_trigger
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_accounts_updated_at();

INSERT INTO accounts (id, name, slug)
SELECT
  '10000000-0000-0000-0000-000000000001'::UUID,
  'Shift Engine Default Account',
  'shift-engine-default'
WHERE NOT EXISTS (
  SELECT 1
  FROM accounts
  WHERE id = '10000000-0000-0000-0000-000000000001'::UUID
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on accounts" ON accounts;
CREATE POLICY "Allow all on accounts" ON accounts FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. LOCATIONS BELONG TO AN ACCOUNT
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'locations'
      AND column_name = 'account_id'
  ) THEN
    ALTER TABLE locations ADD COLUMN account_id UUID;
  END IF;
END $$;

UPDATE locations
SET account_id = '10000000-0000-0000-0000-000000000001'::UUID
WHERE account_id IS NULL;

ALTER TABLE locations
  ALTER COLUMN account_id SET DEFAULT '10000000-0000-0000-0000-000000000001'::UUID;

ALTER TABLE locations
  ALTER COLUMN account_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'locations_account_id_fkey'
  ) THEN
    ALTER TABLE locations
      ADD CONSTRAINT locations_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_locations_account_id ON locations(account_id);

-- ============================================
-- 3. LOCATION-AWARE UPLOADS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'uploads'
      AND column_name = 'account_id'
  ) THEN
    ALTER TABLE uploads ADD COLUMN account_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'uploads'
      AND column_name = 'location_id'
  ) THEN
    ALTER TABLE uploads ADD COLUMN location_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'uploads'
      AND column_name = 'source_type'
  ) THEN
    ALTER TABLE uploads ADD COLUMN source_type TEXT DEFAULT 'csv';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'uploads'
      AND column_name = 'source_filename'
  ) THEN
    ALTER TABLE uploads ADD COLUMN source_filename TEXT;
  END IF;
END $$;

ALTER TABLE uploads
  ALTER COLUMN source_type SET DEFAULT 'csv';

ALTER TABLE uploads
  DROP CONSTRAINT IF EXISTS uploads_date_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploads_account_id_fkey'
  ) THEN
    ALTER TABLE uploads
      ADD CONSTRAINT uploads_account_id_fkey
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploads_location_id_fkey'
  ) THEN
    ALTER TABLE uploads
      ADD CONSTRAINT uploads_location_id_fkey
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploads_source_type_check'
  ) THEN
    ALTER TABLE uploads
      ADD CONSTRAINT uploads_source_type_check
      CHECK (source_type IN ('csv', 'api'));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uploads_account_location_date_key'
  ) THEN
    ALTER TABLE uploads
      ADD CONSTRAINT uploads_account_location_date_key
      UNIQUE (account_id, location_id, date);
  END IF;
END $$;

UPDATE uploads
SET account_id = locations.account_id
FROM locations
WHERE uploads.location_id = locations.id
  AND uploads.account_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_uploads_account_location_date
  ON uploads(account_id, location_id, date);

CREATE INDEX IF NOT EXISTS idx_uploads_location_id
  ON uploads(location_id);

-- Legacy uploads with NULL location_id remain valid so existing historical
-- data is still accessible while new uploads become location-aware.
