-- 005_cities_approvals.sql

-- ── 1. Cities table ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO cities (name) VALUES
  ('Doha'), ('Lusail'), ('Al Wakra'), ('Al Khor'), ('Al Rayyan'),
  ('Al Shamal'), ('Umm Salal'), ('Al Daayen'), ('Mesaieed'), ('The Pearl')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cities_read_all" ON cities FOR SELECT USING (true);
CREATE POLICY "cities_admin_insert" ON cities FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
);
CREATE POLICY "cities_admin_delete" ON cities FOR DELETE USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
);


-- ── 2. Portal user approval ───────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved boolean NOT NULL DEFAULT false;
-- Existing users are already verified — mark them approved
UPDATE profiles SET approved = true;


-- ── 3. Marketing invites (admin creates invite by email) ──
CREATE TABLE IF NOT EXISTS marketing_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE marketing_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_admin_all" ON marketing_invites FOR ALL USING (
  EXISTS (SELECT 1 FROM admin_users WHERE email = auth.email())
);


-- ── 4. Update handle_new_user trigger ────────────────────
-- Sets role='marketing' + approved=true if email is in marketing_invites
-- Otherwise role='user' + approved=false (needs admin approval)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  invite_exists boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.marketing_invites WHERE email = NEW.email
  ) INTO invite_exists;

  INSERT INTO public.profiles (id, full_name, role, approved)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE WHEN invite_exists THEN 'marketing' ELSE 'user' END,
    invite_exists
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 5. RLS: marketing users can update all approved properties ──
-- (needed to upload/remove images via the media manager)
CREATE POLICY "properties_marketing_update" ON properties
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'marketing')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'marketing')
  );
