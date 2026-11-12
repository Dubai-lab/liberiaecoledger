-- ============================================================
-- GENERAL E-WASTE REGISTRATION BY CONSUMERS
-- Manufacturers remain the source of truth for Smartphones and
-- Laptops (claimed by IMEI / serial). Every other electronic item
-- — televisions, refrigerators, printers, tablets, etc. — can be
-- registered directly by its owner and later put up for recycling.
-- ============================================================

-- Rules on every device insert
CREATE OR REPLACE FUNCTION enforce_manufacturer_device()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.imei := NULLIF(regexp_replace(COALESCE(NEW.imei, ''), '[^0-9]', '', 'g'), '');
  NEW.serial_number := NULLIF(btrim(COALESCE(NEW.serial_number, '')), '');
  NEW.category := btrim(COALESCE(NEW.category, ''));

  IF NEW.category = '' THEN
    RAISE EXCEPTION 'A device category is required' USING ERRCODE = 'check_violation';
  ELSIF NEW.category = 'Smartphone' THEN
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
    -- Other electronics: IMEI optional, but must be valid if given
    IF NEW.imei IS NOT NULL AND NOT is_valid_imei(NEW.imei) THEN
      RAISE EXCEPTION 'The IMEI is not valid (leave it blank if the device has none)' USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Only manufacturer-sourced categories get a "manufactured" genesis event
CREATE OR REPLACE FUNCTION log_device_manufactured()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_name TEXT;
  v_city TEXT;
BEGIN
  IF NEW.category NOT IN ('Smartphone', 'Laptop') THEN
    RETURN NEW;
  END IF;
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

-- Separate, admin-tunable reward for self-registered (non-registry) devices
INSERT INTO platform_rates (key, category, label, unit, value, sort_order) VALUES
  ('credits_registration_other', 'credit', 'Other device registration', 'EC per device', 10, 2)
ON CONFLICT (key) DO NOTHING;

-- Consumers register non-phone / non-laptop electronics through this guarded path
CREATE OR REPLACE FUNCTION register_consumer_device(
  p_category           TEXT,
  p_brand              TEXT,
  p_model              TEXT,
  p_serial_number      TEXT    DEFAULT NULL,
  p_manufacture_year   INT     DEFAULT NULL,
  p_hazard_class       TEXT    DEFAULT 'none',
  p_purchase_date      DATE    DEFAULT NULL,
  p_purchase_price_lrd NUMERIC DEFAULT NULL,
  p_retailer_name      TEXT    DEFAULT NULL,
  p_receipt_url        TEXT    DEFAULT NULL,
  p_receipt_ipfs_hash  TEXT    DEFAULT NULL
)
RETURNS TABLE (device_id UUID, credits INT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
#variable_conflict use_column
DECLARE
  v_me       UUID := auth_profile_id();
  v_name     TEXT;
  v_city     TEXT;
  v_category TEXT := btrim(COALESCE(p_category, ''));
  v_brand    TEXT := btrim(COALESCE(p_brand, ''));
  v_model    TEXT := btrim(COALESCE(p_model, ''));
  v_credits  INT  := COALESCE(round(rate_value('credits_registration_other'))::INT, 0);
  v_id       UUID;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF v_category IN ('Smartphone', 'Laptop') THEN
    RAISE EXCEPTION 'Phones and laptops come from the manufacturer registry — verify them by IMEI or serial number instead';
  END IF;
  IF v_category NOT IN ('Tablet', 'Desktop Computer', 'Television', 'Refrigerator', 'Washing Machine', 'Air Conditioner',
                        'Microwave', 'Printer', 'Monitor', 'Audio Equipment', 'Gaming Console', 'Camera', 'Power Tool',
                        'Battery / Power Bank', 'Networking Equipment', 'Other') THEN
    RAISE EXCEPTION 'Unknown device category: %', v_category;
  END IF;
  IF length(v_brand) < 1 OR length(v_brand) > 80 OR length(v_model) < 1 OR length(v_model) > 120 THEN
    RAISE EXCEPTION 'Brand and model are required';
  END IF;
  IF p_manufacture_year IS NOT NULL AND (p_manufacture_year < 1950 OR p_manufacture_year > extract(year FROM now())::INT) THEN
    RAISE EXCEPTION 'Manufacture year is not valid';
  END IF;

  SELECT full_name, city INTO v_name, v_city FROM profiles WHERE id = v_me;

  INSERT INTO devices (brand, model, category, serial_number, manufacture_year, hazard_class,
                       current_owner_id, original_owner_id, status, purchase_date, purchase_price_lrd,
                       retailer_name, receipt_url, receipt_ipfs_hash, co2_kg_avoided)
  VALUES (v_brand, v_model, v_category, NULLIF(btrim(COALESCE(p_serial_number, '')), ''), p_manufacture_year,
          COALESCE(NULLIF(p_hazard_class, ''), 'none')::hazard_class,
          v_me, v_me, 'in_use', p_purchase_date, p_purchase_price_lrd,
          NULLIF(btrim(COALESCE(p_retailer_name, '')), ''), p_receipt_url, p_receipt_ipfs_hash, 0)
  RETURNING id INTO v_id;

  INSERT INTO device_lifecycle (device_id, event_type, actor_id, actor_name, location, metadata)
  VALUES (v_id, 'registered', v_me, COALESCE(v_name, 'Consumer'),
          CASE WHEN v_city IS NOT NULL THEN v_city || ', Liberia' ELSE 'Liberia' END,
          jsonb_build_object('brand', v_brand, 'model', v_model, 'category', v_category,
                             'registry_verified', false, 'self_registered', true));

  IF v_credits > 0 THEN
    INSERT INTO eco_credits (user_id, amount, type, source, device_id, description)
    VALUES (v_me, v_credits, 'earned', 'registration', v_id, 'Registered ' || v_brand || ' ' || v_model || ' on EcoLedger');
  END IF;

  RETURN QUERY SELECT v_id, v_credits;
END;
$$;

REVOKE ALL ON FUNCTION register_consumer_device(TEXT, TEXT, TEXT, TEXT, INT, TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION register_consumer_device(TEXT, TEXT, TEXT, TEXT, INT, TEXT, DATE, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;
