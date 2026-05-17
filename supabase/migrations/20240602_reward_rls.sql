-- ── RLS for reward_catalogue and redemptions ──────────────────────────────────

ALTER TABLE reward_catalogue ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions      ENABLE ROW LEVEL SECURITY;

-- ── reward_catalogue ──────────────────────────────────────────────────────────
-- Any authenticated user can read active items (mobile + web catalogue)
CREATE POLICY "catalogue: authenticated read"
  ON reward_catalogue FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Admin can insert, update, delete catalogue items
CREATE POLICY "catalogue: admin manage"
  ON reward_catalogue FOR ALL
  USING (has_role('admin'));

-- ── redemptions ───────────────────────────────────────────────────────────────
-- Consumers can see their own redemptions
CREATE POLICY "redemptions: own read"
  ON redemptions FOR SELECT
  USING (user_id = auth_profile_id());

-- Admin can read all redemptions
CREATE POLICY "redemptions: admin read"
  ON redemptions FOR SELECT
  USING (has_role('admin'));

-- Any authenticated user can create a redemption (consumer placing a reward)
CREATE POLICY "redemptions: authenticated insert"
  ON redemptions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Admin can update redemptions (fulfill / fail)
CREATE POLICY "redemptions: admin update"
  ON redemptions FOR UPDATE
  USING (has_role('admin'));
