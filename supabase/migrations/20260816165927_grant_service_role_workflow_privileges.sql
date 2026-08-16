-- Edge Functions use service_role only for privileged account provisioning.
-- This is intentionally narrow: profile creation remains trigger-owned.
GRANT SELECT, UPDATE ON public.profiles TO service_role;

NOTIFY pgrst, 'reload schema';
