-- ── Auditor / Regulator read-all policies ────────────────────────────────────
--
-- Auditors and regulators need read access to all disposals and transfers
-- for independent verification. Without these policies, they only see 0
-- records because the existing RLS restricts reads to the record owner.

-- ── disposals ─────────────────────────────────────────────────────────────────
CREATE POLICY "disposals: auditor read all"
  ON disposals FOR SELECT
  USING (has_role('auditor') OR has_role('regulator') OR has_role('admin'));

-- ── transfers ─────────────────────────────────────────────────────────────────
CREATE POLICY "transfers: auditor read all"
  ON transfers FOR SELECT
  USING (has_role('auditor') OR has_role('regulator') OR has_role('admin'));
