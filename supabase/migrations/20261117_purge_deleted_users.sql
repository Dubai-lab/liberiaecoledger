-- ============================================================
-- DELETING A USER REMOVES ALL OF THEIR DATA
--
-- Replaces the "tombstone" behaviour of 20261116: when an auth user is
-- deleted (Supabase dashboard, Auth admin API, or the in-app
-- "Delete account" button) the profile and everything that belongs to
-- that user is deleted, so they no longer appear or count anywhere.
--
--   Deleted with the user:
--     profile, roles, notifications, redemptions, EcoCredits earned,
--     devices they currently own (with those devices' lifecycle,
--     transfers, disposals, credits and flags), invitations and access
--     requests sent to their email, recycler facilities with no
--     disposal history.
--
--   Kept for OTHER users, with the deleted person's link removed (NULL):
--     lifecycle events / transfers on devices now owned by someone else,
--     disposals they performed for other owners, admin audit columns
--     (verified_by, reviewed_by, invited_by, updated_by, ...).
--     A facility that has processed other people's devices is
--     deactivated and unlinked instead of deleted.
--
-- On-chain (Sepolia) transactions are immutable and cannot be erased;
-- they only carry wallet addresses / device hashes, not personal data.
-- ============================================================

-- 1. Counterparty links become nullable + ON DELETE SET NULL ------------
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('device_lifecycle',      'actor_id'),
      ('devices',               'original_owner_id'),
      ('transfers',             'from_user_id'),
      ('transfers',             'to_user_id'),
      ('disposals',             'recycler_id'),
      ('invitations',           'invited_by'),
      ('recycler_facilities',   'owner_id'),
      ('compliance_flags',      'reporter_id'),
      ('compliance_flags',      'resolved_by'),
      ('user_roles',            'verified_by'),
      ('redemptions',           'fulfilled_by'),
      ('access_requests',       'reviewed_by'),
      ('platform_rates',        'updated_by'),
      ('platform_rate_history', 'changed_by')
    ) AS t(tbl, col)
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN %I DROP NOT NULL', r.tbl, r.col);
    -- drop whatever FK currently covers this column, then recreate it

    EXECUTE (
      SELECT string_agg(format('ALTER TABLE %I DROP CONSTRAINT %I', r.tbl, c.conname), '; ')
        FROM pg_constraint c
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
       WHERE c.contype = 'f' AND c.conrelid = r.tbl::regclass AND a.attname = r.col
    );
    EXECUTE format(
      'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES profiles(id) ON DELETE SET NULL',
      r.tbl, r.tbl || '_' || r.col || '_fkey', r.col);
  END LOOP;
END $$;

-- 2. Purge routine --------------------------------------------------------
CREATE OR REPLACE FUNCTION purge_profile(p_profile_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_email TEXT;
  v_devices UUID[];
BEGIN
  SELECT lower(email) INTO v_email FROM profiles WHERE id = p_profile_id;

  -- Devices the user currently owns, and everything recorded about them
  SELECT coalesce(array_agg(id), '{}') INTO v_devices FROM devices WHERE current_owner_id = p_profile_id;
  DELETE FROM eco_credits      WHERE device_id = ANY (v_devices)
                                  OR disposal_id IN (SELECT id FROM disposals WHERE device_id = ANY (v_devices));
  DELETE FROM disposals        WHERE device_id = ANY (v_devices);
  DELETE FROM transfers        WHERE device_id = ANY (v_devices);
  DELETE FROM compliance_flags WHERE device_id = ANY (v_devices);
  DELETE FROM devices          WHERE id = ANY (v_devices);   -- lifecycle cascades

  -- The user's own records
  DELETE FROM eco_credits   WHERE user_id = p_profile_id;
  DELETE FROM redemptions   WHERE user_id = p_profile_id;
  DELETE FROM notifications WHERE user_id = p_profile_id;
  DELETE FROM user_roles    WHERE user_id = p_profile_id;

  -- Recycler facilities: delete when unused, otherwise deactivate
  DELETE FROM recycler_facilities f
   WHERE f.owner_id = p_profile_id
     AND NOT EXISTS (SELECT 1 FROM disposals d WHERE d.facility_id = f.id);
  UPDATE recycler_facilities SET is_active = false WHERE owner_id = p_profile_id;

  -- Invitations / access requests addressed to this email
  IF v_email IS NOT NULL THEN
    DELETE FROM access_requests WHERE lower(email) = v_email;
    DELETE FROM invitations     WHERE lower(email) = v_email;
  END IF;

  -- Remaining links on other people's records become NULL via the FKs
  DELETE FROM profiles WHERE id = p_profile_id;
END;
$$;
REVOKE ALL ON FUNCTION purge_profile(UUID) FROM PUBLIC, anon, authenticated;

-- 3. Auth-user delete trigger now purges --------------------------------
CREATE OR REPLACE FUNCTION handle_auth_user_deleted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_pid UUID;
BEGIN
  FOR v_pid IN SELECT id FROM profiles WHERE supabase_uid = OLD.id LOOP
    PERFORM purge_profile(v_pid);
  END LOOP;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;
CREATE TRIGGER on_auth_user_deleted
  BEFORE DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_deleted();

-- 4. Self-service "Delete account" from the app --------------------------
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not signed in';
  END IF;
  DELETE FROM auth.users WHERE id = auth.uid();   -- trigger purges the profile
END;
$$;
REVOKE ALL ON FUNCTION delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION delete_my_account() TO authenticated;

-- 5. Clean up users already deleted under the old tombstone behaviour ----
DO $$
DECLARE v_pid UUID;
BEGIN
  FOR v_pid IN SELECT id FROM profiles WHERE deleted_at IS NOT NULL LOOP
    PERFORM purge_profile(v_pid);
  END LOOP;
END $$;

ALTER TABLE profiles DROP COLUMN IF EXISTS deleted_at;
