-- ============================================================
-- CONSUMER EMAIL/PASSWORD SIGNUP
-- The signup forms call supabase.auth.signUp() with first_name /
-- last_name / full_name in user metadata. Copy the name onto the
-- profile when the auth user is created so the "needs setup" route
-- guard doesn't send consumers to /setup-account.
--
-- Preserves the live behaviour: users with a pending invitation do
-- NOT get the default consumer role (their invited role is assigned
-- in /setup-account).
--
-- Also required in the Supabase dashboard (not SQL):
--   Authentication → Providers → Email: "Confirm email" ON
--   Authentication → Email Templates → "Confirm signup": include the
--     one-time code {{ .Token }} (verified with verifyOtp type 'signup').
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id     UUID;
  v_has_invitation BOOLEAN;
  v_name           TEXT := NULLIF(
    btrim(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      concat_ws(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')
    )),
    ''
  );
BEGIN
  INSERT INTO profiles (supabase_uid, email, full_name, country, active_role)
  VALUES (NEW.id, NEW.email, left(v_name, 120), 'Liberia', 'consumer')
  ON CONFLICT (supabase_uid) DO NOTHING;

  SELECT id INTO v_profile_id
  FROM profiles
  WHERE supabase_uid = NEW.id
  LIMIT 1;

  IF v_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE email = NEW.email
      AND accepted_at IS NULL
      AND expires_at > NOW()
  ) INTO v_has_invitation;

  IF NOT v_has_invitation THEN
    INSERT INTO user_roles (user_id, role, is_verified)
    VALUES (v_profile_id, 'consumer', true)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
