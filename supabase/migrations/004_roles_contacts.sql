-- 004_roles_contacts.sql

-- ──────────────────────────────────────────────────────
-- 1. Add role + agent profile fields to profiles
-- ──────────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'agent', 'marketing')),
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS position text,
  ADD COLUMN IF NOT EXISTS bio text;

-- ──────────────────────────────────────────────────────
-- 2. Add property-level contact overrides
-- ──────────────────────────────────────────────────────
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_whatsapp text;

-- ──────────────────────────────────────────────────────
-- 3. Admin can read/update all profiles (for role management)
-- Already covered by profiles_admin_all policy in 003
-- ──────────────────────────────────────────────────────
