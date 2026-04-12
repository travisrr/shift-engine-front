-- Migration: Add PPA to historical server scores
-- Run this in your Supabase SQL Editor if `server_scores.ppa` does not exist yet.

ALTER TABLE server_scores
ADD COLUMN IF NOT EXISTS ppa NUMERIC;

-- Backfill historical rows from the stored hourly metrics.
-- Because `sales_hr / guests_hr` simplifies to `net_sales / guests_served`,
-- this restores PPA for old uploads as closely as the existing data allows.
UPDATE server_scores
SET ppa = ROUND((sales_hr / NULLIF(guests_hr, 0))::numeric, 2)
WHERE ppa IS NULL;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'server_scores'
  AND column_name = 'ppa';
