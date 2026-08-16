-- Batch 1: secure account moderation, listing workflow, RLS, and storage baseline.
-- This is forward-only and must be applied to the NEW Supabase project only.

BEGIN;

-- Keep the legacy allow-list only long enough to promote already-existing administrators.
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS account_status text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS submitted_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS rejected_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS published_at timestamptz;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS unpublished_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
UPDATE public.profiles
SET role = CASE role WHEN 'marketing' THEN 'staff' WHEN 'agent' THEN 'broker' WHEN 'user' THEN 'broker' ELSE role END;
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (SELECT p.id FROM public.profiles p JOIN public.admin_users a ON a.email = (SELECT email FROM auth.users u WHERE u.id = p.id));
UPDATE public.profiles
SET account_status = CASE WHEN role = 'admin' OR approved THEN 'approved' ELSE 'pending' END
WHERE account_status IS NULL;
ALTER TABLE public.profiles ALTER COLUMN account_status SET DEFAULT 'pending';
ALTER TABLE public.profiles ALTER COLUMN account_status SET NOT NULL;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'broker', 'staff'));
ALTER TABLE public.profiles ADD CONSTRAINT profiles_account_status_check CHECK (account_status IN ('pending', 'approved', 'rejected', 'suspended'));

ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_listing_status_check;
UPDATE public.properties
SET listing_status = CASE listing_status WHEN 'pending' THEN 'pending_review' WHEN 'approved' THEN 'published' ELSE listing_status END;
ALTER TABLE public.properties ALTER COLUMN listing_status SET DEFAULT 'draft';
ALTER TABLE public.properties ADD CONSTRAINT properties_listing_status_check
  CHECK (listing_status IN ('draft', 'pending_review', 'changes_requested', 'approved', 'published', 'rejected', 'unpublished'));
UPDATE public.properties SET published_at = COALESCE(published_at, updated_at, created_at) WHERE listing_status = 'published';

CREATE TABLE IF NOT EXISTS public.listing_review_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('submitted', 'resubmitted', 'changes_requested', 'approved', 'rejected', 'published', 'unpublished')),
  previous_status text,
  new_status text NOT NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listing_review_events_property_created_idx ON public.listing_review_events(property_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.account_moderation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('approved', 'rejected', 'suspended', 'role_changed')),
  previous_role text,
  new_role text,
  previous_status text,
  new_status text,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS account_moderation_events_user_created_idx ON public.account_moderation_events(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND account_status = 'approved') $$;

CREATE OR REPLACE FUNCTION public.current_user_is_approved_contributor()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('broker', 'staff') AND account_status = 'approved') $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, account_status, approved)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'broker', 'pending', false)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF current_setting('app.admin_account_update', true) = 'on' OR auth.role() = 'service_role' OR current_user = 'postgres' THEN RETURN NEW; END IF;
  IF NEW.role IS DISTINCT FROM OLD.role OR NEW.account_status IS DISTINCT FROM OLD.account_status OR NEW.approved IS DISTINCT FROM OLD.approved THEN
    RAISE EXCEPTION 'Authorization fields may only be changed through administrator moderation';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_property_owner_on_insert()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NOT public.current_user_is_admin() THEN
    IF NOT public.current_user_is_approved_contributor() THEN RAISE EXCEPTION 'Approved broker or staff account required'; END IF;
    NEW.owner_id := auth.uid();
    NEW.listing_status := 'draft';
    NEW.approved_by := NULL; NEW.approved_at := NULL; NEW.rejected_by := NULL; NEW.rejected_at := NULL; NEW.published_at := NULL; NEW.unpublished_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.guard_property_update()
RETURNS trigger
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF current_setting('app.listing_transition', true) = 'on' THEN RETURN NEW; END IF;
  IF NEW.listing_status IS DISTINCT FROM OLD.listing_status THEN
    RAISE EXCEPTION 'Listing state changes must use the controlled transition functions';
  END IF;
  IF NOT public.current_user_is_admin() THEN
    IF NOT public.current_user_is_approved_contributor() OR OLD.owner_id IS DISTINCT FROM auth.uid() THEN RAISE EXCEPTION 'Only the approved listing owner may edit this listing'; END IF;
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.approved_by IS DISTINCT FROM OLD.approved_by OR NEW.approved_at IS DISTINCT FROM OLD.approved_at OR NEW.rejected_by IS DISTINCT FROM OLD.rejected_by OR NEW.rejected_at IS DISTINCT FROM OLD.rejected_at OR NEW.published_at IS DISTINCT FROM OLD.published_at OR NEW.unpublished_at IS DISTINCT FROM OLD.unpublished_at THEN
      RAISE EXCEPTION 'Broker cannot change ownership or moderation metadata';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_privileged_update ON public.profiles;
CREATE TRIGGER profiles_guard_privileged_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();
DROP TRIGGER IF EXISTS properties_set_owner_on_insert ON public.properties;
CREATE TRIGGER properties_set_owner_on_insert BEFORE INSERT ON public.properties FOR EACH ROW EXECUTE FUNCTION public.set_property_owner_on_insert();
DROP TRIGGER IF EXISTS properties_guard_workflow_update ON public.properties;
CREATE TRIGGER properties_guard_workflow_update BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.guard_property_update();

CREATE OR REPLACE FUNCTION public.submit_listing(p_property_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old text;
BEGIN
  IF NOT public.current_user_is_approved_contributor() THEN RAISE EXCEPTION 'Approved broker or staff account required'; END IF;
  SELECT listing_status INTO v_old FROM public.properties WHERE id = p_property_id AND owner_id = auth.uid() FOR UPDATE;
  IF NOT FOUND OR v_old NOT IN ('draft', 'changes_requested') THEN RAISE EXCEPTION 'Only draft or changes-requested listings may be submitted'; END IF;
  PERFORM set_config('app.listing_transition', 'on', true);
  UPDATE public.properties SET listing_status = 'pending_review', submitted_at = now(), rejection_reason = NULL WHERE id = p_property_id;
  INSERT INTO public.listing_review_events(property_id, action, previous_status, new_status, actor_id) VALUES (p_property_id, CASE WHEN v_old = 'draft' THEN 'submitted' ELSE 'resubmitted' END, v_old, 'pending_review', auth.uid());
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_transition_listing(p_property_id uuid, p_action text, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old text; v_new text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  SELECT listing_status INTO v_old FROM public.properties WHERE id = p_property_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found'; END IF;
  v_new := CASE p_action WHEN 'changes_requested' THEN 'changes_requested' WHEN 'approve' THEN 'approved' WHEN 'reject' THEN 'rejected' WHEN 'publish' THEN 'published' WHEN 'unpublish' THEN 'unpublished' END;
  IF v_new IS NULL OR NOT ((v_old = 'pending_review' AND v_new IN ('changes_requested','approved','rejected')) OR (v_old = 'approved' AND v_new = 'published') OR (v_old = 'published' AND v_new = 'unpublished') OR (v_old = 'unpublished' AND v_new = 'published')) THEN RAISE EXCEPTION 'Invalid listing state transition from % to %', v_old, v_new; END IF;
  PERFORM set_config('app.listing_transition', 'on', true);
  UPDATE public.properties SET listing_status = v_new, rejection_reason = CASE WHEN v_new IN ('rejected','changes_requested') THEN COALESCE(p_reason, '') ELSE NULL END,
    approved_by = CASE WHEN v_new = 'approved' THEN auth.uid() ELSE approved_by END, approved_at = CASE WHEN v_new = 'approved' THEN now() ELSE approved_at END,
    rejected_by = CASE WHEN v_new = 'rejected' THEN auth.uid() ELSE rejected_by END, rejected_at = CASE WHEN v_new = 'rejected' THEN now() ELSE rejected_at END,
    published_at = CASE WHEN v_new = 'published' THEN now() ELSE published_at END, unpublished_at = CASE WHEN v_new = 'unpublished' THEN now() ELSE unpublished_at END
  WHERE id = p_property_id;
  INSERT INTO public.listing_review_events(property_id, action, previous_status, new_status, actor_id, reason) VALUES (p_property_id, CASE WHEN v_new = 'approved' THEN 'approved' WHEN v_new = 'published' THEN 'published' WHEN v_new = 'unpublished' THEN 'unpublished' ELSE v_new END, v_old, v_new, auth.uid(), p_reason);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_account(p_user_id uuid, p_role text DEFAULT NULL, p_account_status text DEFAULT NULL, p_reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_old_role text; v_old_status text; v_role text; v_status text; v_action text;
BEGIN
  IF NOT public.current_user_is_admin() THEN RAISE EXCEPTION 'Administrator access required'; END IF;
  SELECT role, account_status INTO v_old_role, v_old_status FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND OR v_old_role = 'admin' THEN RAISE EXCEPTION 'Account cannot be moderated'; END IF;
  v_role := COALESCE(p_role, v_old_role); v_status := COALESCE(p_account_status, v_old_status);
  IF v_role NOT IN ('broker', 'staff') OR v_status NOT IN ('pending', 'approved', 'rejected', 'suspended') THEN RAISE EXCEPTION 'Invalid role or account status'; END IF;
  PERFORM set_config('app.admin_account_update', 'on', true);
  UPDATE public.profiles SET role = v_role, account_status = v_status, approved = (v_status = 'approved') WHERE id = p_user_id;
  v_action := CASE WHEN v_status = 'approved' THEN 'approved' WHEN v_status = 'rejected' THEN 'rejected' WHEN v_status = 'suspended' THEN 'suspended' ELSE 'role_changed' END;
  INSERT INTO public.account_moderation_events(user_id, action, previous_role, new_role, previous_status, new_status, actor_id, reason) VALUES (p_user_id, v_action, v_old_role, v_role, v_old_status, v_status, auth.uid(), p_reason);
END;
$$;

-- Replace permissive RLS policies with role/status/ownership-scoped policies.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_review_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_moderation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_user_own" ON public.profiles; DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
CREATE POLICY "profiles_read_own" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles_update_own_safe" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_admin_read_all" ON public.profiles FOR SELECT TO authenticated USING (public.current_user_is_admin());
DROP POLICY IF EXISTS "properties_admin_read_all" ON public.properties; DROP POLICY IF EXISTS "properties_public_read" ON public.properties; DROP POLICY IF EXISTS "properties_admin_insert" ON public.properties; DROP POLICY IF EXISTS "properties_admin_update" ON public.properties; DROP POLICY IF EXISTS "properties_admin_delete" ON public.properties; DROP POLICY IF EXISTS "properties_portal_insert" ON public.properties; DROP POLICY IF EXISTS "properties_portal_read_own" ON public.properties; DROP POLICY IF EXISTS "properties_portal_update_own" ON public.properties; DROP POLICY IF EXISTS "properties_portal_delete_own" ON public.properties; DROP POLICY IF EXISTS "properties_marketing_update" ON public.properties; DROP POLICY IF EXISTS "properties_marketing_insert" ON public.properties; DROP POLICY IF EXISTS "properties_marketing_select" ON public.properties;
CREATE POLICY "properties_public_read_published" ON public.properties FOR SELECT TO anon, authenticated USING (listing_status = 'published');
CREATE POLICY "properties_admin_all" ON public.properties FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "properties_contributor_read_own" ON public.properties FOR SELECT TO authenticated USING (public.current_user_is_approved_contributor() AND owner_id = auth.uid());
CREATE POLICY "properties_contributor_insert_draft" ON public.properties FOR INSERT TO authenticated WITH CHECK (public.current_user_is_approved_contributor() AND owner_id = auth.uid() AND listing_status = 'draft');
CREATE POLICY "properties_contributor_update_own" ON public.properties FOR UPDATE TO authenticated USING (public.current_user_is_approved_contributor() AND owner_id = auth.uid() AND listing_status IN ('draft','changes_requested')) WITH CHECK (public.current_user_is_approved_contributor() AND owner_id = auth.uid() AND listing_status IN ('draft','changes_requested'));
CREATE POLICY "properties_contributor_delete_own_draft" ON public.properties FOR DELETE TO authenticated USING (public.current_user_is_approved_contributor() AND owner_id = auth.uid() AND listing_status = 'draft');
DROP POLICY IF EXISTS "inquiries_public_insert" ON public.inquiries; DROP POLICY IF EXISTS "inquiries_auth_read" ON public.inquiries; DROP POLICY IF EXISTS "inquiries_auth_update" ON public.inquiries;
CREATE POLICY "inquiries_public_insert" ON public.inquiries FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "inquiries_admin_all" ON public.inquiries FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "settings_public_read" ON public.site_settings; DROP POLICY IF EXISTS "settings_auth_write" ON public.site_settings;
CREATE POLICY "settings_public_read" ON public.site_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "settings_admin_write" ON public.site_settings FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "cities_read_all" ON public.cities; DROP POLICY IF EXISTS "cities_admin_insert" ON public.cities; DROP POLICY IF EXISTS "cities_admin_delete" ON public.cities;
CREATE POLICY "cities_public_read" ON public.cities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "cities_admin_write" ON public.cities FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "invites_admin_all" ON public.marketing_invites;
CREATE POLICY "invites_admin_all" ON public.marketing_invites FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
DROP POLICY IF EXISTS "property_media_public_read" ON public.property_media; DROP POLICY IF EXISTS "property_media_admin_write" ON public.property_media;
CREATE POLICY "property_media_public_read_live" ON public.property_media FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.listing_status = 'published'));
CREATE POLICY "property_media_owner_read" ON public.property_media FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid() AND public.current_user_is_approved_contributor()));
CREATE POLICY "property_media_admin_all" ON public.property_media FOR ALL TO authenticated USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());
CREATE POLICY "listing_review_events_admin_read" ON public.listing_review_events FOR SELECT TO authenticated USING (public.current_user_is_admin());
CREATE POLICY "listing_review_events_owner_read" ON public.listing_review_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_id AND p.owner_id = auth.uid()));
CREATE POLICY "account_moderation_events_admin_read" ON public.account_moderation_events FOR SELECT TO authenticated USING (public.current_user_is_admin());
DROP POLICY IF EXISTS "admin_users_authenticated_read" ON public.admin_users;

-- Secure, public-read property images. Broker uploads must stay in their own folder.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES ('property-images', 'property-images', true, 20971520, ARRAY['image/jpeg','image/png','image/webp','image/avif']) ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS "property_images_public_read" ON storage.objects; DROP POLICY IF EXISTS "property_images_broker_insert" ON storage.objects; DROP POLICY IF EXISTS "property_images_broker_update" ON storage.objects; DROP POLICY IF EXISTS "property_images_broker_delete" ON storage.objects; DROP POLICY IF EXISTS "property_images_admin_all" ON storage.objects;
CREATE POLICY "property_images_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'property-images');
CREATE POLICY "property_images_broker_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'property-images' AND public.current_user_is_approved_contributor() AND (storage.foldername(name))[1] = 'broker' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "property_images_broker_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'property-images' AND public.current_user_is_approved_contributor() AND (storage.foldername(name))[1] = 'broker' AND (storage.foldername(name))[2] = auth.uid()::text) WITH CHECK (bucket_id = 'property-images' AND public.current_user_is_approved_contributor() AND (storage.foldername(name))[1] = 'broker' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "property_images_broker_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'property-images' AND public.current_user_is_approved_contributor() AND (storage.foldername(name))[1] = 'broker' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "property_images_admin_all" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'property-images' AND public.current_user_is_admin()) WITH CHECK (bucket_id = 'property-images' AND public.current_user_is_admin());

REVOKE ALL ON public.listing_review_events, public.account_moderation_events FROM anon, authenticated;
GRANT SELECT ON public.listing_review_events, public.account_moderation_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_listing(uuid), public.admin_transition_listing(uuid, text, text), public.admin_moderate_account(uuid, text, text, text) TO authenticated;
COMMIT;
