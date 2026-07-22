-- 003_listing_portal.sql

-- ──────────────────────────────────────────────────────
-- 1. Admin users table
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  email text PRIMARY KEY
);

-- ──────────────────────────────────────────────────────
-- 2. Profiles table (one row per portal user)
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger: auto-create a profile row when a new auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ──────────────────────────────────────────────────────
-- 3. Portal columns on properties
-- ──────────────────────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS listing_status text NOT NULL DEFAULT 'approved'
    CHECK (listing_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- ──────────────────────────────────────────────────────
-- 4. Drop old overly-permissive RLS policies
-- ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "properties_public_read"  ON properties;
DROP POLICY IF EXISTS "properties_auth_insert"  ON properties;
DROP POLICY IF EXISTS "properties_auth_update"  ON properties;
DROP POLICY IF EXISTS "properties_auth_delete"  ON properties;

-- ──────────────────────────────────────────────────────
-- 5. New properties RLS
-- ──────────────────────────────────────────────────────

-- Admin: can read ALL listings regardless of status (for the review queue)
-- (must come before public read so admin gets the broader policy)
CREATE POLICY "properties_admin_read_all" ON properties
  FOR SELECT TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- Public: only approved listings visible
CREATE POLICY "properties_public_read" ON properties
  FOR SELECT TO anon, authenticated
  USING (listing_status = 'approved');

-- Admin: full write access
CREATE POLICY "properties_admin_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "properties_admin_update" ON properties
  FOR UPDATE TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

CREATE POLICY "properties_admin_delete" ON properties
  FOR DELETE TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- Portal users: insert own listings (always pending)
CREATE POLICY "properties_portal_insert" ON properties
  FOR INSERT TO authenticated
  WITH CHECK (
    owner_id = auth.uid()
    AND listing_status = 'pending'
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- Portal users: read own listings (all statuses)
CREATE POLICY "properties_portal_read_own" ON properties
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

-- Portal users: update own listings
CREATE POLICY "properties_portal_update_own" ON properties
  FOR UPDATE TO authenticated
  USING (
    owner_id = auth.uid()
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- Portal users: delete own listings
CREATE POLICY "properties_portal_delete_own" ON properties
  FOR DELETE TO authenticated
  USING (
    owner_id = auth.uid()
    AND auth.email() NOT IN (SELECT email FROM admin_users)
  );

-- ──────────────────────────────────────────────────────
-- 6. Profiles RLS
-- ──────────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_user_own" ON profiles
  FOR ALL TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (auth.email() IN (SELECT email FROM admin_users));

-- ──────────────────────────────────────────────────────
-- 7. admin_users RLS
-- ──────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_users_authenticated_read" ON admin_users
  FOR SELECT TO authenticated
  USING (true);

-- ──────────────────────────────────────────────────────
-- 8. Seed admin email
-- ──────────────────────────────────────────────────────
INSERT INTO admin_users (email) VALUES ('pranvkithkin11@gmail.com')
ON CONFLICT DO NOTHING;
