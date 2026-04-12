-- Migration: Create allowed_users table for managing software users (GM, Assistant GM, etc.)
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- ALLOWED_USERS TABLE (Software users - GMs, Assistant GMs, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS allowed_users (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    TEXT NOT NULL,
  email        TEXT NOT NULL UNIQUE,
  role         TEXT DEFAULT 'Manager' CHECK (role IN ('General Manager', 'Assistant General Manager', 'Manager', 'Supervisor', 'Owner', 'Admin')),
  phone        TEXT,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for email lookups and active filtering
CREATE INDEX IF NOT EXISTS idx_allowed_users_email ON allowed_users(email);
CREATE INDEX IF NOT EXISTS idx_allowed_users_active ON allowed_users(is_active);

-- Trigger to auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_allowed_users_updated_at ON allowed_users;
CREATE TRIGGER update_allowed_users_updated_at
  BEFORE UPDATE ON allowed_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE allowed_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on allowed_users" ON allowed_users FOR ALL USING (true) WITH CHECK (true);

-- Insert sample data if table is empty
INSERT INTO allowed_users (full_name, email, role)
SELECT 'John Smith', 'john.smith@restaurant.com', 'General Manager'
WHERE NOT EXISTS (SELECT 1 FROM allowed_users);

INSERT INTO allowed_users (full_name, email, role)
SELECT 'Sarah Johnson', 'sarah.j@restaurant.com', 'Assistant General Manager'
WHERE NOT EXISTS (SELECT 1 FROM allowed_users WHERE email = 'sarah.j@restaurant.com');

-- ============================================
-- VERIFY TABLE WAS CREATED
-- ============================================
SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'allowed_users';

-- Show columns for the table
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'allowed_users'
ORDER BY ordinal_position;
