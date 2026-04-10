-- Seed file for adding employees from Toast CSV
-- Run this in your Supabase SQL Editor

-- Insert employees into wait_staff table
INSERT INTO wait_staff (full_name, job_title, hourly_rate, hire_date, status) VALUES
  ('Addie Stubbe', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Alec Ramsey', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Caleigh Graves', 'Bar Tender', 2.13, '2024-01-15', 'Active'),
  ('Chloe Colaianni', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Dean Polizos', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Eric Fowler', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Giselle San Filippo', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Karen Mason', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Lauren Claxton', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Madison Lawrence', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Meredith Johnson', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Morgan Sparkman', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Paige Anderson', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Rachel Brunet', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Thomas Malone', 'Server', 2.13, '2024-01-15', 'Active'),
  ('Ty Buckley', 'Server', 2.13, '2024-01-15', 'Active')
ON CONFLICT DO NOTHING;
