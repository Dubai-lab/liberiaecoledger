-- ============================================================
-- CONSUMER → CONSUMER OWNERSHIP TRANSFER + PER-OWNER DEVICE QR CODES
--
-- Bug fixed: the recipient accepted a transfer by updating `devices`
-- directly, but RLS only lets the CURRENT owner update a device, so the
-- ownership change silently affected 0 rows. The transfer showed
-- "confirmed" while the device stayed with the sender as
-- "awaiting_transfer" and never appeared for the recipient.
--
-- Now every step runs in the database, atomically:
--   initiate_transfer()  sender → creates a pending transfer
--   respond_transfer()   recipient accepts (ownership moves, history +
--                        credits + new QR) or declines
--   cancel_transfer()    sender withdraws a pending transfer
--
-- Past owners keep read access to devices they transferred (history),
-- and recipients can see a device that is being offered to them.
--
-- QR codes: every device stores its QR payload (devices.qr_code). A new
-- code is issued to each new owner. All codes contain the device id, so
-- the in-app scanner still resolves older printed codes.
-- ============================================================

-- 1. QR code stored with the device ----------------------------------------
ALTER TABLE devices ADD COLUMN IF NOT EXISTS qr_code TEXT;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS qr_issued_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION make_device_qr(p_device_id UUID)
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  SELECT 'ecoledger:device:' || p_device_id::TEXT || ':' || substr(md5(gen_random_uuid()::TEXT), 1, 10)
$$;

CREATE OR REPLACE FUNCTION set_device_qr()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := make_device_qr(NEW.id);
    NEW.qr_issued_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_devices_qr ON devices;
CREATE TRIGGER trg_devices_qr BEFORE INSERT ON devices
  FOR EACH ROW EXECUTE FUNCTION set_device_qr();

UPDATE devices SET qr_code = make_device_qr(id), qr_issued_at = coalesce(updated_at, created_at, NOW())
 WHERE qr_code IS NULL;

-- 2. Visibility for transfer parties --------------------------------------
CREATE OR REPLACE FUNCTION is_transfer_party(p_device_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM transfers t
     WHERE t.device_id = p_device_id
       AND (t.from_user_id = auth_profile_id() OR t.to_user_id = auth_profile_id())
  )
$$;

DROP POLICY IF EXISTS "devices: transfer party read" ON devices;
CREATE POLICY "devices: transfer party read" ON devices
  FOR SELECT TO authenticated USING (is_transfer_party(id));

DROP POLICY IF EXISTS "lifecycle: transfer party read" ON device_lifecycle;
CREATE POLICY "lifecycle: transfer party read" ON device_lifecycle
  FOR SELECT TO authenticated USING (is_transfer_party(device_id));

-- Profiles of the other party (name shown on the transfer cards)
DROP POLICY IF EXISTS "profiles: transfer counterpart read" ON profiles;
CREATE POLICY "profiles: transfer counterpart read" ON profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM transfers t
       WHERE (t.from_user_id = auth_profile_id() AND t.to_user_id = profiles.id)
          OR (t.to_user_id = auth_profile_id() AND t.from_user_id = profiles.id)
    )
  );

-- Allow senders to withdraw a pending transfer
ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_status_check;
ALTER TABLE transfers ADD CONSTRAINT transfers_status_check
  CHECK (status IN ('pending', 'signed', 'confirmed', 'rejected', 'cancelled'));

-- 3. Initiate ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION initiate_transfer(
  p_device_id UUID,
  p_recipient_email TEXT,
  p_reason TEXT DEFAULT 'resale',
  p_sale_price_lrd NUMERIC DEFAULT NULL,
  p_condition_notes TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me UUID := auth_profile_id();
  v_to profiles%ROWTYPE;
  v_dev devices%ROWTYPE;
  v_id UUID;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'Please sign in again.'; END IF;

  SELECT * INTO v_dev FROM devices WHERE id = p_device_id FOR UPDATE;
  IF v_dev.id IS NULL OR v_dev.current_owner_id <> v_me THEN
    RAISE EXCEPTION 'You can only transfer a device you currently own.';
  END IF;
  IF v_dev.status NOT IN ('in_use', 'awaiting_transfer') THEN
    RAISE EXCEPTION 'This device cannot be transferred while it is %.', replace(v_dev.status::TEXT, '_', ' ');
  END IF;
  IF EXISTS (SELECT 1 FROM transfers WHERE device_id = p_device_id AND status = 'pending') THEN
    RAISE EXCEPTION 'This device already has a transfer waiting to be accepted. Cancel it first.';
  END IF;

  SELECT * INTO v_to FROM profiles WHERE lower(email) = lower(btrim(p_recipient_email));
  IF v_to.id IS NULL THEN
    RAISE EXCEPTION 'No EcoLedger account uses %. The recipient must sign up first.', btrim(p_recipient_email);
  END IF;
  IF v_to.id = v_me THEN RAISE EXCEPTION 'You cannot transfer a device to yourself.'; END IF;

  INSERT INTO transfers (device_id, from_user_id, to_user_id, reason, sale_price_lrd, condition_notes, evidence_urls, status)
  VALUES (p_device_id, v_me, v_to.id, p_reason, p_sale_price_lrd, nullif(btrim(p_condition_notes), ''), '{}', 'pending')
  RETURNING id INTO v_id;

  UPDATE devices SET status = 'awaiting_transfer' WHERE id = p_device_id;

  RETURN jsonb_build_object('transfer_id', v_id, 'recipient_name', coalesce(v_to.full_name, v_to.email),
                            'recipient_wallet', v_to.wallet_address);
END;
$$;

-- 4. Accept / decline -------------------------------------------------------
CREATE OR REPLACE FUNCTION respond_transfer(p_transfer_id UUID, p_accept BOOLEAN)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_me UUID := auth_profile_id();
  t transfers%ROWTYPE;
  v_dev devices%ROWTYPE;
  v_from profiles%ROWTYPE;
  v_to profiles%ROWTYPE;
  v_credits INT := round(coalesce(rate_value('credits_transfer'), 0));
  v_qr TEXT;
BEGIN
  SELECT * INTO t FROM transfers WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL OR t.to_user_id <> v_me THEN RAISE EXCEPTION 'Transfer not found.'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'This transfer has already been %.', t.status; END IF;

  SELECT * INTO v_dev FROM devices WHERE id = t.device_id FOR UPDATE;

  IF NOT p_accept THEN
    UPDATE transfers SET status = 'rejected' WHERE id = t.id;
    UPDATE devices SET status = 'in_use' WHERE id = t.device_id AND status = 'awaiting_transfer';
    RETURN jsonb_build_object('status', 'rejected');
  END IF;

  IF v_dev.current_owner_id IS DISTINCT FROM t.from_user_id THEN
    UPDATE transfers SET status = 'rejected' WHERE id = t.id;
    RAISE EXCEPTION 'The sender no longer owns this device, so the transfer was cancelled.';
  END IF;

  SELECT * INTO v_from FROM profiles WHERE id = t.from_user_id;
  SELECT * INTO v_to   FROM profiles WHERE id = v_me;
  v_qr := make_device_qr(t.device_id);

  -- Ownership moves to the recipient, who gets a new QR code
  UPDATE devices
     SET current_owner_id = v_me, status = 'in_use', qr_code = v_qr, qr_issued_at = NOW()
   WHERE id = t.device_id;

  UPDATE transfers SET status = 'confirmed' WHERE id = t.id;

  -- Permanent history: who it came from and who it went to
  INSERT INTO device_lifecycle (device_id, event_type, actor_id, actor_name, location, metadata)
  VALUES (t.device_id, 'transferred', t.from_user_id,
          coalesce(v_from.full_name, v_from.email, 'Previous owner'),
          CASE WHEN v_to.city IS NOT NULL THEN v_to.city || ', Liberia' ELSE 'Liberia' END,
          jsonb_build_object('transfer_id', t.id, 'reason', t.reason, 'sale_price_lrd', t.sale_price_lrd,
                             'from_user_id', t.from_user_id, 'from_name', coalesce(v_from.full_name, v_from.email),
                             'to_user_id', v_me, 'to_name', coalesce(v_to.full_name, v_to.email), 'completed', true));

  -- Transfer reward (admin-set rate) to the sender, once
  IF v_credits > 0 AND NOT EXISTS (
       SELECT 1 FROM eco_credits WHERE user_id = t.from_user_id AND device_id = t.device_id
          AND source = 'transfer' AND created_at >= t.created_at) THEN
    INSERT INTO eco_credits (user_id, amount, type, source, device_id, description)
    VALUES (t.from_user_id, v_credits, 'earned', 'transfer', t.device_id,
            'Transferred ' || v_dev.brand || ' ' || v_dev.model || ' to ' || coalesce(v_to.full_name, 'new owner'));
  END IF;

  RETURN jsonb_build_object('status', 'confirmed', 'device_id', t.device_id, 'qr_code', v_qr,
                            'from_wallet', v_from.wallet_address, 'to_wallet', v_to.wallet_address);
END;
$$;

-- 5. Cancel (sender) --------------------------------------------------------
CREATE OR REPLACE FUNCTION cancel_transfer(p_transfer_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE t transfers%ROWTYPE;
BEGIN
  SELECT * INTO t FROM transfers WHERE id = p_transfer_id FOR UPDATE;
  IF t.id IS NULL OR t.from_user_id <> auth_profile_id() THEN RAISE EXCEPTION 'Transfer not found.'; END IF;
  IF t.status <> 'pending' THEN RAISE EXCEPTION 'Only a pending transfer can be cancelled.'; END IF;
  UPDATE transfers SET status = 'cancelled' WHERE id = t.id;
  UPDATE devices SET status = 'in_use' WHERE id = t.device_id AND status = 'awaiting_transfer';
END;
$$;

REVOKE ALL ON FUNCTION initiate_transfer(UUID, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION respond_transfer(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION cancel_transfer(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION initiate_transfer(UUID, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION respond_transfer(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_transfer(UUID) TO authenticated;

-- 6. Repair transfers that were accepted but never moved the device --------
DO $$
DECLARE t RECORD; v_from profiles%ROWTYPE; v_to profiles%ROWTYPE;
BEGIN
  FOR t IN
    SELECT tr.* FROM transfers tr JOIN devices d ON d.id = tr.device_id
     WHERE tr.status = 'confirmed' AND d.current_owner_id = tr.from_user_id AND d.status = 'awaiting_transfer'
  LOOP
    SELECT * INTO v_from FROM profiles WHERE id = t.from_user_id;
    SELECT * INTO v_to   FROM profiles WHERE id = t.to_user_id;
    UPDATE devices SET current_owner_id = t.to_user_id, status = 'in_use',
           qr_code = make_device_qr(t.device_id), qr_issued_at = NOW()
     WHERE id = t.device_id;
    IF NOT EXISTS (SELECT 1 FROM device_lifecycle WHERE device_id = t.device_id AND event_type = 'transferred'
                     AND metadata->>'completed' = 'true' AND created_at >= t.created_at) THEN
      INSERT INTO device_lifecycle (device_id, event_type, actor_id, actor_name, location, metadata)
      VALUES (t.device_id, 'transferred', t.from_user_id, coalesce(v_from.full_name, v_from.email, 'Previous owner'), 'Liberia',
              jsonb_build_object('transfer_id', t.id, 'reason', t.reason, 'from_user_id', t.from_user_id,
                                 'to_user_id', t.to_user_id, 'to_name', coalesce(v_to.full_name, v_to.email), 'completed', true));
    END IF;
  END LOOP;
END $$;

-- 7. Pending transfers to a deleted account can never be accepted: cancel them
UPDATE devices d SET status = 'in_use'
  FROM transfers t
 WHERE t.device_id = d.id AND t.status = 'pending' AND t.to_user_id IS NULL AND d.status = 'awaiting_transfer';
UPDATE transfers SET status = 'cancelled' WHERE status = 'pending' AND to_user_id IS NULL;
