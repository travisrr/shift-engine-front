-- Migration: Create all required tables for Shift-Engine
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- ============================================
-- 1. UPLOADS TABLE (Parent table for CSV uploads)
-- ============================================
CREATE TABLE IF NOT EXISTS uploads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_uploads_date ON uploads(date);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on uploads" ON uploads FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 2. SERVER_SCORES TABLE (Child table for individual server data)
-- ============================================
CREATE TABLE IF NOT EXISTS server_scores (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  upload_id   UUID REFERENCES uploads(id) ON DELETE CASCADE,
  server_name TEXT NOT NULL,
  score       NUMERIC NOT NULL,
  sales_hr    NUMERIC,
  tips_hr     NUMERIC,
  tip_pct     NUMERIC,
  avg_check   NUMERIC,
  guests_hr   NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE server_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on server_scores" ON server_scores FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 3. WAIT_STAFF TABLE (HR management table)
-- ============================================
CREATE TABLE IF NOT EXISTS wait_staff (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    TEXT NOT NULL,
  job_title    TEXT DEFAULT 'Server' CHECK (job_title IN ('Server', 'Bar Tender')),
  hourly_rate  NUMERIC(10,2) DEFAULT 2.13,
  hire_date    DATE NOT NULL,
  status       TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Index for status filtering
CREATE INDEX IF NOT EXISTS idx_wait_staff_status ON wait_staff(status);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger (drop if exists first to avoid conflicts)
DROP TRIGGER IF EXISTS update_wait_staff_updated_at ON wait_staff;
CREATE TRIGGER update_wait_staff_updated_at
  BEFORE UPDATE ON wait_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wait_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on wait_staff" ON wait_staff FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 4. VERIFY TABLES WERE CREATED
-- ============================================
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('uploads', 'server_scores', 'wait_staff')
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
AND table_name IN ('uploads', 'server_scores', 'wait_staff')
ORDER BY table_name, ordinal_position;
