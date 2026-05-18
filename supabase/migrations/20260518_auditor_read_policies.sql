-- ── Auditor / Regulator read-all policies ────────────────────────────────────
--
-- Auditors and regulators need read access to all disposals and transfers
-- for independent verification. Without these policies, they only see 0
-- records because the existing RLS restricts reads to the record owner.
--
-- Uses direct user_roles table lookup (not has_role()) for broad compatibility.

-- ── disposals ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "disposals: auditor read all" ON disposals;

CREATE POLICY "disposals: auditor read all"
  ON disposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('auditor', 'regulator', 'admin')
    )
  );

-- ── transfers ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "transfers: auditor read all" ON transfers;

CREATE POLICY "transfers: auditor read all"
  ON transfers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('auditor', 'regulator', 'admin')
    )
  );
