-- ============================================================
-- ALLOW DELETING USERS (Supabase dashboard / Auth admin API)
--
-- Problem: deleting an auth user cascaded to delete its profile,
-- but devices, lifecycle events, transfers, disposals, credits,
-- invitations, etc. reference profiles without ON DELETE rules,
-- so the delete failed ("Database error deleting user").
--
-- Behaviour now:
--   • A user with no ledger history  → profile fully deleted.
--   • A user with ledger history     → login deleted; profile kept as an
--     anonymous tombstone (personal data removed) so the immutable
--     lifecycle record stays intact. The email can be registered again.
-- ============================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Keep the profile row when its auth user is deleted (the trigger below decides)
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_supabase_uid_fkey;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_supabase_uid_fkey
  FOREIGN KEY (supabase_uid) REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION handle_auth_user_deleted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_pid UUID;
BEGIN
  SELECT id INTO v_pid FROM profiles WHERE supabase_uid = OLD.id;
  IF v_pid IS NULL THEN
    RETURN OLD;
  END IF;

  -- Account-only data goes regardless
  DELETE FROM notifications WHERE user_id = v_pid;
  DELETE FROM user_roles    WHERE user_id = v_pid;

  -- No ledger history? Remove the profile completely.
  BEGIN
    DELETE FROM profiles WHERE id = v_pid;
    RETURN OLD;
  EXCEPTION WHEN foreign_key_violation THEN
    NULL; -- referenced by ledger records → anonymise instead
  END;

  UPDATE profiles
     SET email          = NULL,
         full_name      = 'Deleted user',
         phone          = NULL,
         avatar_url     = NULL,
         wallet_address = NULL,
         privy_id       = NULL,
         city           = NULL,
         deleted_at     = NOW()
   WHERE id = v_pid;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_deleted();
