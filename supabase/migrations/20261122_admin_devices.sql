-- ============================================================
-- ADMIN: VIEW ALL DEVICES AND DELETE A DEVICE
--
-- admin_devices()                 every device with owner names and how
--                                 many linked records it has
-- admin_delete_device(id, dry)    deletes the device and everything that
--                                 references it (lifecycle, transfers,
--                                 disposals, EcoCredits, flags). With
--                                 p_dry_run = true it only returns what
--                                 would be removed.
--
-- Admin only. On-chain (Sepolia) records cannot be deleted.
-- ============================================================

CREATE OR REPLACE FUNCTION admin_devices()
RETURNS TABLE (
  id UUID, brand TEXT, model TEXT, category TEXT, imei TEXT, serial_number TEXT,
  status TEXT, manufacture_year INT, created_at TIMESTAMPTZ, chain_tx_hash TEXT,
  owner_id UUID, owner_name TEXT, owner_email TEXT,
  manufacturer_name TEXT, verified BOOLEAN,
  events BIGINT, transfers BIGINT, disposals BIGINT, credits BIGINT, flags BIGINT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT has_role('admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can view all devices.';
  END IF;

  RETURN QUERY
  SELECT d.id, d.brand, d.model, d.category, d.imei, d.serial_number,
         d.status::TEXT, d.manufacture_year, d.created_at, d.chain_tx_hash,
         o.id, coalesce(o.organization, o.full_name, o.email, 'Deleted user'), o.email,
         (SELECT coalesce(p.organization, p.full_name, l.actor_name)
            FROM device_lifecycle l LEFT JOIN profiles p ON p.id = l.actor_id
           WHERE l.device_id = d.id AND l.event_type = 'manufactured'
           ORDER BY l.created_at LIMIT 1),
         EXISTS (SELECT 1 FROM device_lifecycle l WHERE l.device_id = d.id AND l.event_type = 'manufactured'),
         (SELECT count(*) FROM device_lifecycle l WHERE l.device_id = d.id),
         (SELECT count(*) FROM transfers t WHERE t.device_id = d.id),
         (SELECT count(*) FROM disposals x WHERE x.device_id = d.id),
         (SELECT coalesce(sum(c.amount), 0)::BIGINT FROM eco_credits c WHERE c.device_id = d.id),
         (SELECT count(*) FROM compliance_flags f WHERE f.device_id = d.id)
    FROM devices d
    LEFT JOIN profiles o ON o.id = d.current_owner_id
   ORDER BY d.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_device(p_device_id UUID, p_dry_run BOOLEAN DEFAULT false)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d devices%ROWTYPE;
  v JSONB;
BEGIN
  IF NOT has_role('admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can delete devices.';
  END IF;

  SELECT * INTO d FROM devices WHERE id = p_device_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Device not found.'; END IF;

  v := jsonb_build_object(
    'device',    d.brand || ' ' || d.model,
    'events',    (SELECT count(*) FROM device_lifecycle WHERE device_id = d.id),
    'transfers', (SELECT count(*) FROM transfers WHERE device_id = d.id),
    'disposals', (SELECT count(*) FROM disposals WHERE device_id = d.id),
    'flags',     (SELECT count(*) FROM compliance_flags WHERE device_id = d.id),
    'credits',   (SELECT coalesce(sum(amount), 0) FROM eco_credits
                   WHERE device_id = d.id
                      OR disposal_id IN (SELECT id FROM disposals WHERE device_id = d.id)),
    'on_chain',  d.chain_tx_hash IS NOT NULL
  );
  IF p_dry_run THEN RETURN v; END IF;

  DELETE FROM eco_credits
   WHERE device_id = d.id OR disposal_id IN (SELECT id FROM disposals WHERE device_id = d.id);
  DELETE FROM disposals        WHERE device_id = d.id;
  DELETE FROM transfers        WHERE device_id = d.id;
  DELETE FROM compliance_flags WHERE device_id = d.id;
  DELETE FROM devices          WHERE id = d.id;          -- lifecycle events cascade

  RETURN v || jsonb_build_object('deleted', true);
END;
$$;

REVOKE ALL ON FUNCTION admin_devices() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION admin_delete_device(UUID, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_devices() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_delete_device(UUID, BOOLEAN) TO authenticated;
