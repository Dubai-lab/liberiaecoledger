-- ============================================================
-- CONSUMER EMAIL/PASSWORD SIGNUP
-- The mobile signup form calls supabase.auth.signUp() with
-- first_name / last_name / full_name in user metadata. Copy the
-- name onto the profile when the auth user is created so the
-- "needs setup" route guard doesn't send consumers to /setup-account.
--
-- Also required in the Supabase dashboard (not SQL):
--   Authentication → Providers → Email: "Confirm email" ON
--   Authentication → Email Templates → "Confirm signup": include
--     the one-time code, e.g.  <h2>{{ .Token }}</h2>
--   (the app verifies the code with verifyOtp type 'signup').
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  meta_name TEXT := NULLIF(
    btrim(COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      concat_ws(' ', NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'last_name')
    )),
    ''
  );
BEGIN
  INSERT INTO profiles (supabase_uid, email, full_name, country, active_role)
  VALUES (NEW.id, NEW.email, left(meta_name, 120), 'Liberia', 'consumer')
  ON CONFLICT (supabase_uid) DO NOTHING;

  -- Grant every new user the consumer role by default
  INSERT INTO user_roles (user_id, role, is_verified)
  SELECT id, 'consumer', true
  FROM profiles
  WHERE supabase_uid = NEW.id
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;
