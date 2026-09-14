-- ================================================================
-- CampusFind AI – Seed Data (development only)
-- Run AFTER schema.sql.
-- ================================================================

-- Campus locations
INSERT INTO locations (name, icon, description) VALUES
  ('Main Gate',            '🚪', 'Primary campus entrance'),
  ('Library',              '📚', 'Central library building'),
  ('Canteen',              '🍽️',  'Main campus cafeteria'),
  ('Block A',              '🏢', 'Block A academic building'),
  ('Block B',              '🏗️', 'Block B academic building'),
  ('Laboratory',           '🔬', 'Science and computer labs'),
  ('Auditorium',           '🎭', 'Main auditorium'),
  ('Playground',           '⚽', 'Sports grounds'),
  ('Parking Area',         '🚗', 'Student parking'),
  ('Sports Ground',        '🏃', 'Athletics field'),
  ('Block A Lecture Hall', '🎓', 'Lecture halls in Block A'),
  ('Cafeteria',            '☕', 'Secondary cafeteria near Block B'),
  ('Library Reading Room', '📖', 'Quiet reading room inside library'),
  ('Other',                '📍', 'Other campus location')
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- Demo users must be created via Supabase Auth (see README).
-- After creating auth users, their UUIDs will auto-populate the
-- profiles table via the handle_new_user() trigger.
--
-- Recommended demo accounts:
--   student1@campusfind.dev  / Test@1234
--   student2@campusfind.dev  / Test@1234
--   student3@campusfind.dev  / Test@1234
--   admin@campusfind.dev     / Admin@1234  (set role='admin' manually)
--
-- After creating users, run the setup script in README to seed
-- items, matches, and notifications for demo purposes.
-- ================================================================
