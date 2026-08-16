-- The dashboard SQL editor executes as the database owner, not service_role.
-- Permit that owner-only bootstrap path while keeping all client requests guarded.
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
