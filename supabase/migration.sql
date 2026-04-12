-- Shift-Engine: Historical Data Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Parent table: one row per CSV upload
CREATE TABLE IF NOT EXISTS uploads (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date       DATE NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Child table: one row per server per upload
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
  ppa         NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast date lookups
CREATE INDEX IF NOT EXISTS idx_uploads_date ON uploads(date);

-- Enable RLS (recommended) — adjust policies to your auth needs
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_scores ENABLE ROW LEVEL SECURITY;

-- Allow anon read/write for now (tighten later with auth)
CREATE POLICY "Allow all on uploads" ON uploads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on server_scores" ON server_scores FOR ALL USING (true) WITH CHECK (true);
