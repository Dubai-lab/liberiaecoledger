-- ============================================================
-- IN-APP QR SCANNER LOOKUP
--
-- scan_device(code) — used by the Scan Device page on the Consumer,
-- Recycler and Regulator dashboards. Accepts what a scan or a typed
-- entry gives: an EcoLedger QR (device id, or a URL containing it),
-- an IMEI, or a serial number. Returns one JSON document with the
-- device, whether it is in the manufacturer registry, the current
-- owner, the full lifecycle, open compliance flags and disposal record.
--
-- Runs as SECURITY DEFINER because consumers cannot read other people's
-- devices directly. Owner contact details (email / phone) are only
-- returned to regulators, recyclers, auditors and admins.
-- ============================================================

CREATE OR REPLACE FUNCTION scan_device(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_code   TEXT := btrim(coalesce(p_code, ''));
  v_digits TEXT := regexp_replace(coalesce(p_code, ''), '\D', '', 'g');
  v_uuid   UUID;
  v_me     UUID;
  v_roles  TEXT[];
  v_priv   BOOLEAN;
  d        devices%ROWTYPE;
  o        profiles%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Please sign in to scan devices';
  END IF;
  IF v_code = '' THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT id INTO v_me FROM profiles WHERE supabase_uid = auth.uid();
  SELECT coalesce(array_agg(role::TEXT), '{}') INTO v_roles FROM user_roles WHERE user_id = v_me;
  v_priv := v_roles && ARRAY['regulator', 'recycler', 'auditor', 'admin'];

  -- 1. EcoLedger QR: device id, possibly inside a URL
  v_uuid := substring(v_code FROM '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}')::UUID;
  IF v_uuid IS NOT NULL THEN
    SELECT * INTO d FROM devices WHERE id = v_uuid;
  END IF;
  -- 2. IMEI
  IF d.id IS NULL AND length(v_digits) = 15 THEN
    SELECT * INTO d FROM devices WHERE imei = v_digits ORDER BY created_at LIMIT 1;
  END IF;
  -- 3. Serial number
  IF d.id IS NULL THEN
    SELECT * INTO d FROM devices WHERE lower(serial_number) = lower(v_code) ORDER BY created_at LIMIT 1;
  END IF;

  IF d.id IS NULL THEN
    RETURN jsonb_build_object('found', false);
  END IF;

  SELECT * INTO o FROM profiles WHERE id = d.current_owner_id;

  RETURN jsonb_build_object(
    'found', true,
    'device', jsonb_build_object(
      'id', d.id, 'brand', d.brand, 'model', d.model, 'category', d.category,
      'imei', d.imei, 'serial_number', d.serial_number, 'manufacture_year', d.manufacture_year,
      'status', d.status, 'hazard_class', d.hazard_class, 'registered_at', d.created_at,
      'token_id', d.token_id, 'chain_tx_hash', d.chain_tx_hash,
      'materials', jsonb_build_object(
        'gold', d.material_gold_g, 'copper', d.material_copper_g, 'aluminum', d.material_aluminum_g,
        'lithium', d.material_lithium_g, 'cobalt', d.material_cobalt_g, 'lead', d.material_lead_g)
    ),
    -- In the manufacturer registry = has a 'manufactured' genesis event
    'verified', EXISTS (SELECT 1 FROM device_lifecycle WHERE device_id = d.id AND event_type = 'manufactured'),
    'manufacturer', (
      SELECT coalesce(p.organization, p.full_name, l.actor_name)
        FROM device_lifecycle l LEFT JOIN profiles p ON p.id = l.actor_id
       WHERE l.device_id = d.id AND l.event_type = 'manufactured'
       ORDER BY l.created_at LIMIT 1
    ),
    'owner', CASE WHEN o.id IS NULL THEN NULL ELSE jsonb_build_object(
      'name',   coalesce(o.organization, o.full_name, 'EcoLedger user'),
      'person', o.full_name,
      'roles',  (SELECT coalesce(jsonb_agg(role), '[]') FROM user_roles WHERE user_id = o.id),
      'city',   o.city,
      'is_you', o.id = v_me,
      'email',  CASE WHEN v_priv THEN o.email END,
      'phone',  CASE WHEN v_priv THEN o.phone END,
      'since',  (SELECT max(created_at) FROM device_lifecycle
                  WHERE device_id = d.id AND event_type IN ('manufactured', 'registered', 'transferred'))
    ) END,
    'lifecycle', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'event_type', event_type, 'actor_name', actor_name, 'location', location,
               'tx_hash', tx_hash, 'created_at', created_at) ORDER BY created_at), '[]')
        FROM device_lifecycle WHERE device_id = d.id
    ),
    'open_flags', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'flag_type', flag_type, 'severity', severity, 'status', status, 'created_at', created_at)
               ORDER BY created_at DESC), '[]')
        FROM compliance_flags WHERE device_id = d.id AND coalesce(status, '') NOT IN ('resolved', 'closed', 'dismissed')
    ),
    'disposal', (
      SELECT jsonb_build_object(
               'disposal_type', x.disposal_type, 'facility', f.name, 'city', f.location_city,
               'final_mass_kg', x.final_mass_kg, 'eco_credits_awarded', x.eco_credits_awarded,
               'tx_hash', x.tx_hash, 'created_at', x.created_at)
        FROM disposals x LEFT JOIN recycler_facilities f ON f.id = x.facility_id
       WHERE x.device_id = d.id ORDER BY x.created_at DESC LIMIT 1
    ),
    'viewer', jsonb_build_object('roles', to_jsonb(v_roles), 'is_owner', d.current_owner_id = v_me)
  );
END;
$$;

REVOKE ALL ON FUNCTION scan_device(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION scan_device(TEXT) TO authenticated;
