-- ============================================================
-- MANUFACTURER DEVICE REGISTRY + ADMIN-MANAGED RATES + PUBLIC LEDGER
--
-- 1. Manufacturers are the only source of devices: Smartphones (unique,
--    valid 15-digit IMEI required) and Laptops (serial number required,
--    IMEI optional — no uniqueness enforced for laptops).
--    Every manufacturer insert automatically writes a 'manufactured'
--    genesis event, which is what puts a device in the registry.
-- 2. Consumers register by *claiming* a registry device by IMEI (or a
--    laptop serial): verify_device() checks it, claim_device() moves
--    ownership + writes the ledger event + awards EcoCredits atomically.
-- 3. platform_rates holds EcoCredit transaction rates and material market
--    prices (per gram), editable by admins, with full change history.
-- 4. public_ledger() exposes a privacy-safe feed of lifecycle events to
--    anyone (no consumer names, identifiers masked).
-- ============================================================

-- ── IMEI helpers ─────────────────────────────────────────────

-- 15 digits + valid Luhn check digit
CREATE OR REPLACE FUNCTION is_valid_imei(p_imei TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  total INT := 0;
  d INT;
BEGIN
  IF p_imei IS NULL OR p_imei !~ '^[0-9]{15}$' THEN
    RETURN FALSE;
  END IF;
  FOR i IN 1..15 LOOP
    d := substr(p_imei, i, 1)::INT;
    IF i % 2 = 0 THEN
      d := d * 2;
      IF d > 9 THEN d := d - 9; END IF;
    END IF;
    total := total + d;
  END LOOP;
  RETURN total % 10 = 0;
END;
$$;

-- Smartphone IMEIs are unique; laptops are uniqueness-free
CREATE UNIQUE INDEX IF NOT EXISTS uq_devices_smartphone_imei
  ON devices(imei) WHERE imei IS NOT NULL AND category = 'Smartphone';
CREATE INDEX IF NOT EXISTS idx_devices_serial_lower ON devices(lower(btrim(serial_number)));

-- ── Only manufacturers (or admins) may create device records ──

DROP POLICY IF EXISTS "devices: authenticated insert" ON devices;
DROP POLICY IF EXISTS "devices: manufacturer insert" ON devices;
CREATE POLICY "devices: manufacturer insert"
  ON devices FOR INSERT
  TO authenticated
  WITH CHECK (
    (has_role('manufacturer') AND original_owner_id = auth_profile_id() AND current_owner_id = auth_profile_id())
    OR has_role('admin')
  );

CREATE OR REPLACE FUNCTION enforce_manufacturer_device()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.imei := NULLIF(regexp_replace(COALESCE(NEW.imei, ''), '[^0-9]', '', 'g'), '');
  NEW.serial_number := NULLIF(btrim(COALESCE(NEW.serial_number, '')), '');

  IF NEW.category = 'Smartphone' THEN
    IF NOT is_valid_imei(NEW.imei) THEN
      RAISE EXCEPTION 'Smartphones need a valid 15-digit IMEI' USING ERRCODE = 'check_violation';
    END IF;
  ELSIF NEW.category = 'Laptop' THEN
    IF NEW.serial_number IS NULL THEN
      RAISE EXCEPTION 'Laptops need a serial number' USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.imei IS NOT NULL AND NOT is_valid_imei(NEW.imei) THEN
      RAISE EXCEPTION 'The laptop IMEI is not valid (leave it blank if the laptop has none)' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    RAISE EXCEPTION 'Only Smartphone and Laptop devices can be registered by manufacturers' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_devices_manufacturer_rules ON devices;
CREATE TRIGGER trg_devices_manufacturer_rules
  BEFORE INSERT ON devices
  FOR EACH ROW EXECUTE FUNCTION enforce_manufacturer_device();

-- Genesis event: written by the database so a registry entry can never lack provenance
CREATE OR REPLACE FUNCTION log_device_manufactured()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT;
  v_city TEXT;
BEGIN
  SELECT COALESCE(organization, full_name, 'Manufacturer'), city INTO v_name, v_city
    FROM profiles WHERE id = NEW.original_owner_id;
  INSERT INTO device_lifecycle (device_id, event_type, actor_id, actor_name, location, metadata)
  VALUES (NEW.id, 'manufactured', NEW.original_owner_id, v_name,
          CASE WHEN v_city IS NOT NULL THEN v_city || ', Liberia' ELSE 'Liberia' END,
          jsonb_build_object('brand', NEW.brand, 'model', NEW.model, 'category', NEW.category,
                             'hazard_class', NEW.hazard_class, 'has_imei', NEW.imei IS NOT NULL));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_devices_log_manufactured ON devices;
CREATE TRIGGER trg_devices_log_manufactured
  AFTER INSERT ON devices
  FOR EACH ROW EXECUTE FUNCTION log_device_manufactured();

-- ── Platform rates (EcoCredit rates + material prices) ───────

CREATE TABLE IF NOT EXISTS platform_rates (
  key         TEXT PRIMARY KEY,
  category    TEXT NOT NULL CHECK (category IN ('credit', 'material', 'conversion')),
  label       TEXT NOT NULL,
  unit        TEXT NOT NULL,
  value       NUMERIC(14,4) NOT NULL CHECK (value >= 0),
  sort_order  INT NOT NULL DEFAULT 0,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS platform_rate_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         TEXT NOT NULL REFERENCES platform_rates(key) ON DELETE CASCADE,
  old_value   NUMERIC(14,4),
  new_value   NUMERIC(14,4) NOT NULL,
  changed_by  UUID REFERENCES profiles(id),
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_history_changed ON platform_rate_history(changed_at DESC);

-- Seed values reproduce the previous hard-coded behaviour exactly:
--   registration 10 EC, transfer 5 EC, and disposal credits per gram of
--   gold 50 / copper 5 / aluminium 2 / lithium 30 / cobalt 20 / lead 3
--   (= price per gram ÷ 150 LRD per EcoCredit).
INSERT INTO platform_rates (key, category, label, unit, value, sort_order) VALUES
  ('credits_registration', 'credit',     'Device registration',  'EC per device',   10,   1),
  ('credits_transfer',     'credit',     'Ownership transfer',   'EC per transfer', 5,    2),
  ('lrd_per_credit',       'conversion', 'EcoCredit value',      'LRD per EC',      150,  3),
  ('price_gold',           'material',   'Gold',                 'LRD per gram',    7500, 10),
  ('price_copper',         'material',   'Copper',               'LRD per gram',    750,  11),
  ('price_aluminum',       'material',   'Aluminium',            'LRD per gram',    300,  12),
  ('price_lithium',        'material',   'Lithium',              'LRD per gram',    4500, 13),
  ('price_cobalt',         'material',   'Cobalt',               'LRD per gram',    3000, 14),
  ('price_lead',           'material',   'Lead',                 'LRD per gram',    450,  15)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION log_platform_rate_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.value IS DISTINCT FROM OLD.value THEN
    NEW.updated_at := NOW();
    NEW.updated_by := auth_profile_id();
    INSERT INTO platform_rate_history (key, old_value, new_value, changed_by)
    VALUES (NEW.key, OLD.value, NEW.value, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_platform_rates_history ON platform_rates;
CREATE TRIGGER trg_platform_rates_history
  BEFORE UPDATE ON platform_rates
  FOR EACH ROW EXECUTE FUNCTION log_platform_rate_change();

ALTER TABLE platform_rates        ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_rate_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rates: public read" ON platform_rates;
CREATE POLICY "rates: public read" ON platform_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "rates: admin update" ON platform_rates;
CREATE POLICY "rates: admin update" ON platform_rates FOR UPDATE
  TO authenticated USING (has_role('admin')) WITH CHECK (has_role('admin'));

DROP POLICY IF EXISTS "rate history: admin read" ON platform_rate_history;
CREATE POLICY "rate history: admin read" ON platform_rate_history FOR SELECT
  TO authenticated USING (has_role('admin'));

GRANT SELECT ON public.platform_rates        TO anon, authenticated;
GRANT UPDATE ON public.platform_rates        TO authenticated;
GRANT SELECT ON public.platform_rate_history TO authenticated;

CREATE OR REPLACE FUNCTION rate_value(p_key TEXT)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
  SELECT value FROM platform_rates WHERE key = p_key
$$;

-- ── Registry lookup helpers ──────────────────────────────────

-- In manufacturer stock = has a genesis event, never changed hands, still in use
CREATE OR REPLACE FUNCTION device_in_stock(p_device_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM devices d
     WHERE d.id = p_device_id
       AND d.status = 'in_use'
       AND d.current_owner_id = d.original_owner_id
       AND EXISTS (SELECT 1 FROM device_lifecycle l WHERE l.device_id = d.id AND l.event_type = 'manufactured')
       AND NOT EXISTS (SELECT 1 FROM device_lifecycle l
                        WHERE l.device_id = d.id AND l.event_type IN ('registered', 'transferred')
                          AND l.actor_id <> d.original_owner_id)
  )
$$;

-- Registry devices matching an identifier: a valid IMEI, otherwise a laptop serial number
CREATE OR REPLACE FUNCTION registry_matches(p_identifier TEXT)
RETURNS SETOF UUID LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_digits TEXT := regexp_replace(COALESCE(p_identifier, ''), '[^0-9]', '', 'g');
  v_serial TEXT := lower(btrim(COALESCE(p_identifier, '')));
BEGIN
  IF is_valid_imei(v_digits) AND v_digits = regexp_replace(btrim(p_identifier), '[\s-]', '', 'g') THEN
    RETURN QUERY
      SELECT d.id FROM devices d
       WHERE d.imei = v_digits
         AND EXISTS (SELECT 1 FROM device_lifecycle l WHERE l.device_id = d.id AND l.event_type = 'manufactured');
  ELSIF length(v_serial) >= 4 THEN
    RETURN QUERY
      SELECT d.id FROM devices d
       WHERE d.category = 'Laptop'
         AND lower(btrim(d.serial_number)) = v_serial
         AND EXISTS (SELECT 1 FROM device_lifecycle l WHERE l.device_id = d.id AND l.event_type = 'manufactured');
  END IF;
END;
$$;

-- ── Consumer verification + claim ────────────────────────────

DROP FUNCTION IF EXISTS verify_device_imei(TEXT);
CREATE OR REPLACE FUNCTION verify_device(p_identifier TEXT)
RETURNS TABLE (status TEXT, brand TEXT, model TEXT, category TEXT, manufacture_year INT, manufacturer TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_me       UUID := auth_profile_id();
  v_ids      UUID[];
  v_stock    UUID[];
  v_pick     UUID;
  v_status   TEXT;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT array_agg(id) INTO v_ids FROM registry_matches(p_identifier) AS id;
  IF v_ids IS NULL THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INT, NULL::TEXT;
    RETURN;
  END IF;

  SELECT array_agg(x) INTO v_stock FROM unnest(v_ids) x WHERE device_in_stock(x);

  IF array_length(v_stock, 1) = 1 THEN
    v_pick := v_stock[1]; v_status := 'available';
  ELSIF array_length(v_stock, 1) > 1 THEN
    v_pick := v_stock[1]; v_status := 'ambiguous';
  ELSE
    SELECT x INTO v_pick FROM unnest(v_ids) x JOIN devices d ON d.id = x WHERE d.current_owner_id = v_me LIMIT 1;
    IF v_pick IS NOT NULL THEN
      v_status := 'owned_by_you';
    ELSE
      v_pick := v_ids[1]; v_status := 'already_registered';
    END IF;
  END IF;

  RETURN QUERY
    SELECT v_status, d.brand, d.model, d.category, d.manufacture_year, COALESCE(p.organization, p.full_name)
      FROM devices d JOIN profiles p ON p.id = d.original_owner_id
     WHERE d.id = v_pick;
END;
$$;

DROP FUNCTION IF EXISTS claim_device(TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION claim_device(
  p_identifier         TEXT,
  p_purchase_date      DATE    DEFAULT NULL,
  p_purchase_price_lrd NUMERIC DEFAULT NULL,
  p_retailer_name      TEXT    DEFAULT NULL,
  p_receipt_url        TEXT    DEFAULT NULL,
  p_receipt_ipfs_hash  TEXT    DEFAULT NULL
)
RETURNS TABLE (device_id UUID, brand TEXT, model TEXT, credits INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_me      UUID := auth_profile_id();
  v_name    TEXT;
  v_city    TEXT;
  v_credits INT  := COALESCE(round(rate_value('credits_registration'))::INT, 0);
  v_stock   UUID[];
  d         devices%ROWTYPE;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT array_agg(x) INTO v_stock FROM registry_matches(p_identifier) x WHERE device_in_stock(x);

  IF v_stock IS NULL THEN
    IF EXISTS (SELECT 1 FROM registry_matches(p_identifier) x JOIN devices dv ON dv.id = x WHERE dv.current_owner_id = v_me) THEN
      RAISE EXCEPTION 'This device is already registered to you';
    ELSIF EXISTS (SELECT 1 FROM registry_matches(p_identifier)) THEN
      RAISE EXCEPTION 'This device has already been registered by another owner';
    END IF;
    RAISE EXCEPTION 'This device is not in the manufacturer registry';
  END IF;
  IF array_length(v_stock, 1) > 1 THEN
    RAISE EXCEPTION 'Several laptops share this serial number — use the IMEI or contact the manufacturer';
  END IF;

  -- Lock the row so two people can't claim the same device at once
  SELECT dv.* INTO d FROM devices dv WHERE dv.id = v_stock[1] FOR UPDATE;
  IF NOT device_in_stock(d.id) THEN
    RAISE EXCEPTION 'This device has already been registered by another owner';
  END IF;

  SELECT full_name, city INTO v_name, v_city FROM profiles WHERE id = v_me;

  UPDATE devices
     SET current_owner_id   = v_me,
         purchase_date      = COALESCE(p_purchase_date, purchase_date),
         purchase_price_lrd = COALESCE(p_purchase_price_lrd, purchase_price_lrd),
         retailer_name      = COALESCE(NULLIF(btrim(p_retailer_name), ''), retailer_name),
         receipt_url        = COALESCE(p_receipt_url, receipt_url),
         receipt_ipfs_hash  = COALESCE(p_receipt_ipfs_hash, receipt_ipfs_hash)
   WHERE id = d.id;

  INSERT INTO device_lifecycle (device_id, event_type, actor_id, actor_name, location, metadata)
  VALUES (d.id, 'registered', v_me, COALESCE(v_name, 'Consumer'),
          CASE WHEN v_city IS NOT NULL THEN v_city || ', Liberia' ELSE 'Liberia' END,
          jsonb_build_object('brand', d.brand, 'model', d.model, 'category', d.category,
                             'registry_verified', true, 'from_manufacturer', d.original_owner_id));

  IF v_credits > 0 THEN
    INSERT INTO eco_credits (user_id, amount, type, source, device_id, description)
    VALUES (v_me, v_credits, 'earned', 'registration', d.id,
            'Registered ' || d.brand || ' ' || d.model || ' on EcoLedger');
  END IF;

  RETURN QUERY SELECT d.id, d.brand, d.model, v_credits;
END;
$$;

-- ── Public ledger (read-only, privacy-safe) ──────────────────

CREATE OR REPLACE FUNCTION public_ledger(p_limit INT DEFAULT 50, p_before TIMESTAMPTZ DEFAULT NULL)
RETURNS TABLE (
  id UUID, event_type TEXT, created_at TIMESTAMPTZ,
  brand TEXT, model TEXT, category TEXT,
  device_ref TEXT, identifier_hint TEXT,
  actor_label TEXT, location TEXT, tx_hash TEXT, block_number BIGINT
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    l.id, l.event_type, l.created_at,
    d.brand, d.model, d.category,
    left(d.id::TEXT, 8),
    CASE
      WHEN d.imei IS NOT NULL THEN 'IMEI •••' || right(d.imei, 4)
      WHEN d.serial_number IS NOT NULL THEN 'S/N •••' || right(d.serial_number, 4)
      ELSE NULL
    END,
    -- Organisations are named; private individuals never are
    CASE l.event_type
      WHEN 'manufactured' THEN COALESCE(p.organization, 'Manufacturer')
      WHEN 'disposed'     THEN COALESCE(p.organization, 'Certified recycler')
      WHEN 'flagged'      THEN COALESCE(p.organization, 'Regulator')
      ELSE 'Device owner'
    END,
    -- City-level location only
    split_part(COALESCE(l.location, ''), ',', 1),
    l.tx_hash, l.block_number
  FROM device_lifecycle l
  JOIN devices d ON d.id = l.device_id
  LEFT JOIN profiles p ON p.id = l.actor_id
  WHERE p_before IS NULL OR l.created_at < p_before
  ORDER BY l.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
$$;

REVOKE ALL ON FUNCTION verify_device(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION claim_device(TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION registry_matches(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION device_in_stock(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION verify_device(TEXT)                                  TO authenticated;
GRANT EXECUTE ON FUNCTION claim_device(TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION is_valid_imei(TEXT)                                  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rate_value(TEXT)                                     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public_ledger(INT, TIMESTAMPTZ)                      TO anon, authenticated;
