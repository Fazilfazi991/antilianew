-- Fresh SQL-created tables need explicit Data API grants; RLS remains the authorization boundary.
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, phone, whatsapp, position, bio) ON public.profiles TO authenticated;

GRANT SELECT ON public.properties TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.properties TO authenticated;
GRANT INSERT ON public.inquiries TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_settings TO authenticated;
GRANT SELECT ON public.cities TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.cities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_invites TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.property_media TO anon, authenticated;
GRANT SELECT ON public.listing_review_events, public.account_moderation_events TO authenticated;

NOTIFY pgrst, 'reload schema';
