-- Seed file for adding employees from Toast CSV
-- Run this in your Supabase SQL Editor

-- Insert employees into wait_staff table
INSERT INTO wait_staff (full_name, hourly_rate, hire_date, status) VALUES
  ('Addie Stubbe', 2.13, '2024-01-15', 'Active'),
  ('Alec Ramsey', 2.13, '2024-01-15', 'Active'),
  ('Caleigh Graves', 2.13, '2024-01-15', 'Active'),
  ('Chloe Colaianni', 2.13, '2024-01-15', 'Active'),
  ('Dean Polizos', 2.13, '2024-01-15', 'Active'),
  ('Eric Fowler', 2.13, '2024-01-15', 'Active'),
  ('Giselle San Filippo', 2.13, '2024-01-15', 'Active'),
  ('Karen Mason', 2.13, '2024-01-15', 'Active'),
  ('Lauren Claxton', 2.13, '2024-01-15', 'Active'),
  ('Madison Lawrence', 2.13, '2024-01-15', 'Active'),
  ('Meredith Johnson', 2.13, '2024-01-15', 'Active'),
  ('Morgan Sparkman', 2.13, '2024-01-15', 'Active'),
  ('Paige Anderson', 2.13, '2024-01-15', 'Active'),
  ('Rachel Brunet', 2.13, '2024-01-15', 'Active'),
  ('Thomas Malone', 2.13, '2024-01-15', 'Active'),
  ('Ty Buckley', 2.13, '2024-01-15', 'Active')
ON CONFLICT DO NOTHING;
