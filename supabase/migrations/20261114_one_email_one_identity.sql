-- ============================================================
-- ONE EMAIL = ONE IDENTITY
-- An email address can be used once: either it already has an
-- account, or it has one open access request / invitation.
-- Extra roles for an existing user are granted by an admin
-- (Admin → Users), never by a second request or account.
-- ============================================================

-- What (if anything) an email is already used for
CREATE OR REPLACE FUNCTION email_usage(p_email TEXT)
RETURNS TEXT LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v TEXT := lower(btrim(COALESCE(p_email, '')));
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users u WHERE lower(u.email) = v)
     OR EXISTS (SELECT 1 FROM profiles p WHERE lower(p.email) = v) THEN
    RETURN 'account';
  END IF;
  IF EXISTS (SELECT 1 FROM invitations i WHERE lower(i.email) = v AND i.accepted_at IS NULL AND i.expires_at > NOW()) THEN
    RETURN 'invitation';
  END IF;
  IF EXISTS (SELECT 1 FROM access_requests r WHERE lower(r.email) = v AND r.status = 'pending') THEN
    RETURN 'request';
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION email_usage(TEXT) FROM PUBLIC;

-- ── Access requests ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION guard_access_request_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_use TEXT;
BEGIN
  NEW.email := lower(btrim(NEW.email));
  v_use := email_usage(NEW.email);
  IF v_use = 'account' THEN
    RAISE EXCEPTION 'An account already exists for this email. Sign in instead — an admin can add roles to your existing account.'
      USING ERRCODE = 'unique_violation';
  ELSIF v_use = 'invitation' THEN
    RAISE EXCEPTION 'An invitation has already been sent to this email. Check your inbox (and spam folder) for your access code.'
      USING ERRCODE = 'unique_violation';
  ELSIF v_use = 'request' THEN
    RAISE EXCEPTION 'An access request for this email is already being reviewed. We will be in touch within 2 business days.'
      USING ERRCODE = 'unique_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_access_requests_email ON access_requests;
CREATE TRIGGER trg_access_requests_email
  BEFORE INSERT ON access_requests
  FOR EACH ROW EXECUTE FUNCTION guard_access_request_email();

-- Belt and braces against races: one pending request per email
CREATE UNIQUE INDEX IF NOT EXISTS uq_access_requests_pending_email
  ON access_requests (lower(email)) WHERE status = 'pending';

-- ── Invitations ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION guard_invitation_email()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_use TEXT;
BEGIN
  NEW.email := lower(btrim(NEW.email));
  v_use := email_usage(NEW.email);
  IF v_use = 'account' THEN
    RAISE EXCEPTION 'This email already has an account. Assign the role from Admin → Users instead of sending an invitation.'
      USING ERRCODE = 'unique_violation';
  ELSIF v_use = 'invitation' THEN
    RAISE EXCEPTION 'This email already has a pending invitation. Resend it or revoke it first.'
      USING ERRCODE = 'unique_violation';
  END IF;
  -- A pending access request for the same email is fine: approving it is what creates this invitation
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_invitations_email ON invitations;
CREATE TRIGGER trg_invitations_email
  BEFORE INSERT ON invitations
  FOR EACH ROW EXECUTE FUNCTION guard_invitation_email();

-- ── Consumer sign-up ─────────────────────────────────────────
-- Supabase Auth already refuses a second account for the same email.
-- Additionally, an email with a stakeholder request under review can't
-- also self-register as a consumer (invited users are unaffected: their
-- request is 'approved' and they hold a pending invitation).
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
  SELECT EXISTS (
    SELECT 1 FROM invitations
    WHERE lower(email) = lower(NEW.email)
      AND accepted_at IS NULL
      AND expires_at > NOW()
  ) INTO v_has_invitation;

  IF NOT v_has_invitation
     AND EXISTS (SELECT 1 FROM access_requests r WHERE lower(r.email) = lower(NEW.email) AND r.status = 'pending') THEN
    RAISE EXCEPTION 'EMAIL_HAS_PENDING_ACCESS_REQUEST';
  END IF;

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

  IF NOT v_has_invitation THEN
    INSERT INTO user_roles (user_id, role, is_verified)
    VALUES (v_profile_id, 'consumer', true)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
