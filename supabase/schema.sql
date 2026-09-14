-- ================================================================
-- CampusFind AI – Complete Supabase PostgreSQL Schema
-- Paste this entire file into Supabase SQL Editor and run it.
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- TABLE: profiles
-- ================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  student_id  TEXT,
  department  TEXT,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
  points      INTEGER NOT NULL DEFAULT 0,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role       ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON profiles(student_id);

-- ================================================================
-- TABLE: items
-- ================================================================
CREATE TABLE IF NOT EXISTS items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  item_type           TEXT NOT NULL CHECK (item_type IN ('lost','found')),
  item_name           TEXT NOT NULL,
  category            TEXT NOT NULL CHECK (category IN (
                        'ID Card','Books','Electronics','Bags',
                        'Keys','Water Bottle','Accessories','Other')),
  color               TEXT NOT NULL,
  location            TEXT NOT NULL,
  date                DATE NOT NULL,
  description         TEXT NOT NULL,
  image_url           TEXT,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
                        'active','matched','claimed','recovered','closed')),
  contact_information TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_user_id    ON items(user_id);
CREATE INDEX IF NOT EXISTS idx_items_item_type  ON items(item_type);
CREATE INDEX IF NOT EXISTS idx_items_category   ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_location   ON items(location);
CREATE INDEX IF NOT EXISTS idx_items_status     ON items(status);
CREATE INDEX IF NOT EXISTS idx_items_created_at ON items(created_at DESC);

-- ================================================================
-- TABLE: matches
-- ================================================================
CREATE TABLE IF NOT EXISTS matches (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lost_item_id      UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  found_item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  category_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  color_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  location_score    NUMERIC(5,2) NOT NULL DEFAULT 0,
  description_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  image_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                      'pending','confirmed','rejected','recovered')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(lost_item_id, found_item_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_lost_item    ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found_item   ON matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_total_score  ON matches(total_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_status       ON matches(status);

-- ================================================================
-- TABLE: claims
-- ================================================================
CREATE TABLE IF NOT EXISTS claims (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id              UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  claimant_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  verification_answer  TEXT NOT NULL,
  admin_notes          TEXT,
  status               TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                         'pending','under_review','approved','rejected')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(item_id, claimant_id)
);

CREATE INDEX IF NOT EXISTS idx_claims_item_id     ON claims(item_id);
CREATE INDEX IF NOT EXISTS idx_claims_claimant_id ON claims(claimant_id);
CREATE INDEX IF NOT EXISTS idx_claims_status      ON claims(status);

-- ================================================================
-- TABLE: notifications
-- ================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  message          TEXT NOT NULL,
  type             TEXT NOT NULL DEFAULT 'info' CHECK (type IN (
                     'match','claim','transfer','system','info')),
  related_item_id  UUID REFERENCES items(id) ON DELETE SET NULL,
  related_match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  is_read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notif_user_id  ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read  ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_created  ON notifications(created_at DESC);

-- ================================================================
-- TABLE: messages
-- ================================================================
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id    UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_match_id  ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created   ON messages(created_at ASC);

-- ================================================================
-- TABLE: points_transactions
-- ================================================================
CREATE TABLE IF NOT EXISTS points_transactions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points     INTEGER NOT NULL,
  reason     TEXT NOT NULL,
  item_id    UUID REFERENCES items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pts_user_id ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_pts_created ON points_transactions(created_at DESC);

-- ================================================================
-- TABLE: locations
-- ================================================================
CREATE TABLE IF NOT EXISTS locations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  description TEXT,
  latitude    NUMERIC(10,7),
  longitude   NUMERIC(10,7),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- TABLE: admin_actions
-- ================================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action     TEXT NOT NULL,
  target_id  UUID,
  notes      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_actions_admin    ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created  ON admin_actions(created_at DESC);

-- ================================================================
-- FUNCTION: auto-set updated_at
-- ================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profiles ON profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_items ON items;
CREATE TRIGGER set_updated_at_items
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_claims ON claims;
CREATE TRIGGER set_updated_at_claims
  BEFORE UPDATE ON claims
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- FUNCTION: auto-create profile on auth signup
-- ================================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email, student_id, department, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'student_id',
    NEW.raw_user_meta_data->>'department',
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- HELPER: is current user an admin?
-- ================================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ================================================================
-- ROW LEVEL SECURITY
-- ================================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches             ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims              ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions       ENABLE ROW LEVEL SECURITY;

-- profiles
DROP POLICY IF EXISTS "profiles_select_all"    ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON profiles;

CREATE POLICY "profiles_select_all"  ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());

-- items
DROP POLICY IF EXISTS "items_select_all"          ON items;
DROP POLICY IF EXISTS "items_insert_own"          ON items;
DROP POLICY IF EXISTS "items_update_own_or_admin" ON items;
DROP POLICY IF EXISTS "items_delete_admin"        ON items;

CREATE POLICY "items_select_all"          ON items FOR SELECT USING (TRUE);
CREATE POLICY "items_insert_own"          ON items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "items_update_own_or_admin" ON items FOR UPDATE USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "items_delete_admin"        ON items FOR DELETE USING (is_admin());

-- matches
DROP POLICY IF EXISTS "matches_select_auth"   ON matches;
DROP POLICY IF EXISTS "matches_insert_auth"   ON matches;
DROP POLICY IF EXISTS "matches_update_admin"  ON matches;

CREATE POLICY "matches_select_auth"  ON matches FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "matches_insert_auth"  ON matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "matches_update_admin" ON matches FOR UPDATE USING (is_admin());

-- claims
DROP POLICY IF EXISTS "claims_select_own_or_admin" ON claims;
DROP POLICY IF EXISTS "claims_insert_own"          ON claims;
DROP POLICY IF EXISTS "claims_update_admin"        ON claims;

CREATE POLICY "claims_select_own_or_admin" ON claims FOR SELECT USING (auth.uid() = claimant_id OR is_admin());
CREATE POLICY "claims_insert_own"          ON claims FOR INSERT WITH CHECK (auth.uid() = claimant_id);
CREATE POLICY "claims_update_admin"        ON claims FOR UPDATE USING (is_admin());

-- notifications
DROP POLICY IF EXISTS "notif_select_own"          ON notifications;
DROP POLICY IF EXISTS "notif_insert_any"           ON notifications;
DROP POLICY IF EXISTS "notif_update_own_or_admin"  ON notifications;

CREATE POLICY "notif_select_own"         ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notif_insert_any"          ON notifications FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "notif_update_own_or_admin" ON notifications FOR UPDATE USING (auth.uid() = user_id OR is_admin());

-- messages
DROP POLICY IF EXISTS "messages_select_participants" ON messages;
DROP POLICY IF EXISTS "messages_insert_sender"       ON messages;

CREATE POLICY "messages_select_participants" ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR is_admin());
CREATE POLICY "messages_insert_sender" ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- points_transactions
DROP POLICY IF EXISTS "pts_select_own_or_admin" ON points_transactions;
DROP POLICY IF EXISTS "pts_insert_service"      ON points_transactions;

CREATE POLICY "pts_select_own_or_admin" ON points_transactions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "pts_insert_service" ON points_transactions FOR INSERT
  WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

-- locations
DROP POLICY IF EXISTS "locations_select_all" ON locations;
DROP POLICY IF EXISTS "locations_admin"      ON locations;

CREATE POLICY "locations_select_all" ON locations FOR SELECT USING (TRUE);
CREATE POLICY "locations_admin"      ON locations FOR ALL   USING (is_admin());

-- admin_actions
DROP POLICY IF EXISTS "admin_actions_admin_only" ON admin_actions;
CREATE POLICY "admin_actions_admin_only" ON admin_actions FOR ALL USING (is_admin());

-- ================================================================
-- Storage bucket policy (run after creating bucket 'item-images')
-- ================================================================
-- In Supabase Dashboard > Storage, create a public bucket named: item-images
-- Then run:
--
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('item-images', 'item-images', true)
-- ON CONFLICT (id) DO NOTHING;
--
-- CREATE POLICY "images_select_public" ON storage.objects
--   FOR SELECT USING (bucket_id = 'item-images');
--
-- CREATE POLICY "images_insert_auth" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'item-images' AND auth.uid() IS NOT NULL);
--
-- CREATE POLICY "images_delete_own_or_admin" ON storage.objects
--   FOR DELETE USING (bucket_id = 'item-images' AND
--     (auth.uid()::text = (storage.foldername(name))[1] OR is_admin()));
