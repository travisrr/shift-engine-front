-- Shift-Engine: Wait Staff (HR) Table
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Wait staff table for HR management
CREATE TABLE IF NOT EXISTS wait_staff (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name    TEXT NOT NULL,
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

CREATE TRIGGER update_wait_staff_updated_at
  BEFORE UPDATE ON wait_staff
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (recommended) — adjust policies to your auth needs
ALTER TABLE wait_staff ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for now (tighten later with auth)
CREATE POLICY "Allow all on wait_staff" ON wait_staff FOR ALL USING (true) WITH CHECK (true);
