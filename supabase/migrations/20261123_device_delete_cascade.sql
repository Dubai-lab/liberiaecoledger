-- ============================================================
-- DELETING A DEVICE ANYWHERE REMOVES ITS LINKED RECORDS
-- Makes a device delete from the Supabase dashboard (Table editor)
-- behave like Admin → Devices → Delete: its EcoCredits, transfers,
-- disposals and compliance flags are removed with it (lifecycle events
-- already cascaded). Credits tied to a disposal go with the disposal.
-- ============================================================
ALTER TABLE eco_credits DROP CONSTRAINT IF EXISTS eco_credits_device_id_fkey;
ALTER TABLE eco_credits ADD CONSTRAINT eco_credits_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE eco_credits DROP CONSTRAINT IF EXISTS eco_credits_disposal_id_fkey;
ALTER TABLE eco_credits ADD CONSTRAINT eco_credits_disposal_id_fkey
  FOREIGN KEY (disposal_id) REFERENCES disposals(id) ON DELETE CASCADE;

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_device_id_fkey;
ALTER TABLE transfers ADD CONSTRAINT transfers_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE disposals DROP CONSTRAINT IF EXISTS disposals_device_id_fkey;
ALTER TABLE disposals ADD CONSTRAINT disposals_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;

ALTER TABLE compliance_flags DROP CONSTRAINT IF EXISTS compliance_flags_device_id_fkey;
ALTER TABLE compliance_flags ADD CONSTRAINT compliance_flags_device_id_fkey
  FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE;
