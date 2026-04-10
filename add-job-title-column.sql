-- Migration: Add job_title column to existing wait_staff table
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Add job_title column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'wait_staff' 
    AND column_name = 'job_title'
  ) THEN
    ALTER TABLE wait_staff 
    ADD COLUMN job_title TEXT DEFAULT 'Server' 
    CHECK (job_title IN ('Server', 'Bar Tender'));
    
    RAISE NOTICE 'job_title column added successfully';
  ELSE
    RAISE NOTICE 'job_title column already exists';
  END IF;
END $$;

-- Add updated_at column if it doesn't exist (needed for trigger)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'wait_staff' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE wait_staff 
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
    
    RAISE NOTICE 'updated_at column added successfully';
  END IF;
END $$;

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_trigger 
    WHERE tgname = 'update_wait_staff_updated_at'
  ) THEN
    CREATE TRIGGER update_wait_staff_updated_at
      BEFORE UPDATE ON wait_staff
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'updated_at trigger created successfully';
  END IF;
END $$;

-- Set all existing rows to 'Server' if job_title is NULL
UPDATE wait_staff 
SET job_title = 'Server' 
WHERE job_title IS NULL;

-- Verify the column exists and show sample data
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'wait_staff'
ORDER BY ordinal_position;
