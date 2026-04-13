-- Migration: Add canonical ingestion preview tables
-- Stores raw CSV uploads and normalized preview rows before they are finalized
-- into dashboard-facing uploads/server_scores tables.

CREATE TABLE IF NOT EXISTS ingestion_uploads (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id          UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  location_id         UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  source_type         TEXT NOT NULL DEFAULT 'csv' CHECK (source_type IN ('csv')),
  source_filename     TEXT,
  fallback_date       DATE,
  raw_csv             TEXT NOT NULL,
  parser_version      TEXT NOT NULL DEFAULT 'shift-engine-csv-v1',
  status              TEXT NOT NULL DEFAULT 'previewed' CHECK (status IN ('previewed', 'finalized', 'failed')),
  detected_columns    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metrics_detected    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  file_warnings       TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  accepted_row_count  INTEGER NOT NULL DEFAULT 0,
  rejected_row_count  INTEGER NOT NULL DEFAULT 0,
  finalized_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ingestion_upload_rows (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ingestion_upload_id  UUID NOT NULL REFERENCES ingestion_uploads(id) ON DELETE CASCADE,
  row_index            INTEGER NOT NULL,
  section_label        TEXT,
  source_day           TEXT,
  shift_date           DATE,
  employee_name        TEXT,
  sales_hr             NUMERIC,
  tips_hr              NUMERIC,
  tip_pct              NUMERIC,
  avg_check            NUMERIC,
  guests_hr            NUMERIC,
  ppa                  NUMERIC,
  warnings             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  rejection_reason     TEXT,
  is_accepted          BOOLEAN NOT NULL DEFAULT false,
  raw_values           JSONB NOT NULL DEFAULT '[]'::JSONB,
  created_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE (ingestion_upload_id, row_index)
);

CREATE OR REPLACE FUNCTION update_ingestion_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ingestion_uploads_updated_at_trigger ON ingestion_uploads;
CREATE TRIGGER update_ingestion_uploads_updated_at_trigger
  BEFORE UPDATE ON ingestion_uploads
  FOR EACH ROW
  EXECUTE FUNCTION update_ingestion_uploads_updated_at();

CREATE INDEX IF NOT EXISTS idx_ingestion_uploads_location_created_at
  ON ingestion_uploads(location_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ingestion_uploads_status
  ON ingestion_uploads(status);

CREATE INDEX IF NOT EXISTS idx_ingestion_upload_rows_import_id
  ON ingestion_upload_rows(ingestion_upload_id, row_index);

CREATE INDEX IF NOT EXISTS idx_ingestion_upload_rows_shift_date
  ON ingestion_upload_rows(shift_date);

ALTER TABLE ingestion_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_upload_rows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on ingestion_uploads" ON ingestion_uploads;
CREATE POLICY "Allow all on ingestion_uploads" ON ingestion_uploads FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on ingestion_upload_rows" ON ingestion_upload_rows;
CREATE POLICY "Allow all on ingestion_upload_rows" ON ingestion_upload_rows FOR ALL USING (true) WITH CHECK (true);
