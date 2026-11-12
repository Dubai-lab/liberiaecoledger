-- ============================================================
-- ACCESS REQUESTS
-- Public "Request access" form submissions from stakeholders (consumers sign up directly at /signup). Admins review them
-- under Admin → Invitations; approving one creates an invitation
-- (which emails the access code → magic link → /setup-account).
-- ============================================================

CREATE TABLE IF NOT EXISTS access_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name      TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 120),
  email          TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254 AND email LIKE '%@%'),
  phone          TEXT CHECK (phone IS NULL OR char_length(phone) <= 40),
  organization   TEXT CHECK (organization IS NULL OR char_length(organization) <= 160),
  job_title      TEXT CHECK (job_title IS NULL OR char_length(job_title) <= 120),
  requested_role TEXT NOT NULL CHECK (requested_role IN ('manufacturer','recycler','regulator','auditor','other')),
  message        TEXT CHECK (message IS NULL OR char_length(message) <= 2000),
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by    UUID REFERENCES profiles(id),
  reviewed_at    TIMESTAMPTZ,
  invitation_id  UUID REFERENCES invitations(id) ON DELETE SET NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_access_requests_status  ON access_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_access_requests_email   ON access_requests(email);

ALTER TABLE access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (signed in or not) may submit a request, but only as a fresh pending row.
DROP POLICY IF EXISTS "access_requests: public submit" ON access_requests;
CREATE POLICY "access_requests: public submit"
  ON access_requests FOR INSERT
  TO anon, authenticated
  WITH CHECK (status = 'pending' AND reviewed_by IS NULL AND reviewed_at IS NULL AND invitation_id IS NULL);

-- Only admins can read, review, or delete requests.
DROP POLICY IF EXISTS "access_requests: admin manage" ON access_requests;
CREATE POLICY "access_requests: admin manage"
  ON access_requests FOR ALL
  TO authenticated
  USING (has_role('admin'))
  WITH CHECK (has_role('admin'));

-- Data API grants (anon can only insert — never read other people's requests)
GRANT INSERT                         ON public.access_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.access_requests TO authenticated;
