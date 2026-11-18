-- ============================================================
-- NEW QR CODE FOR EVERY NEW OWNER
-- Whenever a device changes owner (consumer claims it from the
-- manufacturer registry, accepts a transfer, admin reassignment …) it
-- gets a fresh QR code issued to that owner, unless the same update
-- already set one explicitly.
-- ============================================================
CREATE OR REPLACE FUNCTION reissue_device_qr()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.current_owner_id IS DISTINCT FROM OLD.current_owner_id
     AND NEW.qr_code IS NOT DISTINCT FROM OLD.qr_code THEN
    NEW.qr_code := make_device_qr(NEW.id);
    NEW.qr_issued_at := NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_devices_qr_owner_change ON devices;
CREATE TRIGGER trg_devices_qr_owner_change BEFORE UPDATE OF current_owner_id ON devices
  FOR EACH ROW EXECUTE FUNCTION reissue_device_qr();
