-- ============================================================
-- EXPLICIT DATA API GRANTS
-- Required by Supabase policy change:
--   - New projects:      May 30, 2026
--   - Existing projects: October 30, 2026
--
-- RLS policies remain active and still control row-level access.
-- These GRANTs only allow PostgREST/supabase-js to see the tables.
-- Without them, all supabase-js queries will fail after the deadline.
-- ============================================================

-- Schema access
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Table access
-- authenticated: full CRUD (RLS policies restrict actual rows returned)
-- anon:          read-only (only public/invite lookup tables need this)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_lifecycle    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.transfers           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.disposals           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.eco_credits         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recycler_facilities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_flags    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations         TO authenticated;

-- anon role only needs to read invitations (token-based public lookup)
GRANT SELECT ON public.invitations TO anon;

-- Sequences (needed for UUID generation and any serial columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Helper functions used inside RLS policies
GRANT EXECUTE ON FUNCTION public.auth_profile_id()       TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(user_role)     TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at()     TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_auth_user()  TO authenticated;
