-- ============================================================
-- LIBERIA ECOLEDGER — Initial Database Schema
-- Run this entire file in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role      AS ENUM ('consumer','manufacturer','recycler','regulator','auditor','admin');
CREATE TYPE device_status  AS ENUM ('in_use','awaiting_transfer','ready_for_disposal','disposed','flagged');
CREATE TYPE disposal_type  AS ENUM ('recycle','refurbish','salvage_parts','hazardous');
CREATE TYPE hazard_class   AS ENUM ('li_ion_battery','toner','mercury_ccfl','mixed','none');

-- ============================================================
-- UTILITY FUNCTIONS
-- ============================================================

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLES
-- ============================================================

-- 1. profiles (one row per user, linked to auth.users via supabase_uid)
CREATE TABLE profiles (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supabase_uid   UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  privy_id       TEXT UNIQUE,
  wallet_address TEXT,
  email          TEXT,
  full_name      TEXT,
  organization   TEXT,
  phone          TEXT,
  country        TEXT NOT NULL DEFAULT 'Liberia',
  city           TEXT,
  avatar_url     TEXT,
  active_role    user_role NOT NULL DEFAULT 'consumer',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. user_roles (a user can hold multiple roles)
CREATE TABLE user_roles (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         user_role NOT NULL,
  organization TEXT,
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  verified_by  UUID REFERENCES profiles(id),
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 3. devices
CREATE TABLE devices (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_id            TEXT UNIQUE,
  imei                TEXT,
  serial_number       TEXT,
  brand               TEXT NOT NULL,
  model               TEXT NOT NULL,
  category            TEXT NOT NULL,
  manufacture_year    INTEGER,
  current_owner_id    UUID NOT NULL REFERENCES profiles(id),
  original_owner_id   UUID NOT NULL REFERENCES profiles(id),
  retailer_name       TEXT,
  retailer_wallet     TEXT,
  purchase_date       DATE,
  purchase_price_lrd  NUMERIC(12,2),
  status              device_status NOT NULL DEFAULT 'in_use',
  hazard_class        hazard_class NOT NULL DEFAULT 'none',
  receipt_url         TEXT,
  receipt_ipfs_hash   TEXT,
  chain_tx_hash       TEXT,
  block_number        BIGINT,
  co2_kg_avoided      NUMERIC(8,2) NOT NULL DEFAULT 0,
  material_gold_g     NUMERIC(8,3) NOT NULL DEFAULT 0,
  material_copper_g   NUMERIC(8,3) NOT NULL DEFAULT 0,
  material_aluminum_g NUMERIC(8,3) NOT NULL DEFAULT 0,
  material_lithium_g  NUMERIC(8,3) NOT NULL DEFAULT 0,
  material_cobalt_g   NUMERIC(8,3) NOT NULL DEFAULT 0,
  material_lead_g     NUMERIC(8,3) NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_devices_updated_at
  BEFORE UPDATE ON devices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. device_lifecycle (immutable event log, never deleted)
CREATE TABLE device_lifecycle (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id    UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL CHECK (event_type IN ('manufactured','registered','transferred','disposed','flagged')),
  actor_id     UUID NOT NULL REFERENCES profiles(id),
  actor_name   TEXT,
  location     TEXT,
  tx_hash      TEXT,
  block_number BIGINT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. recycler_facilities (must exist before disposals reference it)
CREATE TABLE recycler_facilities (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id                UUID NOT NULL REFERENCES profiles(id),
  name                    TEXT NOT NULL,
  license_number          TEXT UNIQUE NOT NULL,
  location_city           TEXT NOT NULL,
  location_county         TEXT NOT NULL,
  latitude                NUMERIC(9,6),
  longitude               NUMERIC(9,6),
  operating_hours         TEXT,
  accepts_free_pickup     BOOLEAN NOT NULL DEFAULT false,
  is_basel_certified      BOOLEAN NOT NULL DEFAULT false,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  total_devices_processed INTEGER NOT NULL DEFAULT 0,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. transfers
CREATE TABLE transfers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id       UUID NOT NULL REFERENCES devices(id),
  from_user_id    UUID NOT NULL REFERENCES profiles(id),
  to_user_id      UUID NOT NULL REFERENCES profiles(id),
  reason          TEXT NOT NULL CHECK (reason IN ('resale','donation','gift','warranty_return')),
  sale_price_lrd  NUMERIC(12,2),
  condition_notes TEXT,
  evidence_urls   TEXT[] NOT NULL DEFAULT '{}',
  tx_hash         TEXT,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','confirmed','rejected')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. disposals
CREATE TABLE disposals (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id             UUID NOT NULL REFERENCES devices(id),
  recycler_id           UUID NOT NULL REFERENCES profiles(id),
  facility_id           UUID NOT NULL REFERENCES recycler_facilities(id),
  disposal_type         disposal_type NOT NULL,
  final_mass_kg         NUMERIC(8,3) NOT NULL,
  hazard_class          hazard_class NOT NULL DEFAULT 'none',
  downstream_destination TEXT,
  evidence_urls         TEXT[] NOT NULL DEFAULT '{}',
  component_breakdown   JSONB NOT NULL DEFAULT '{}',
  eco_credits_awarded   INTEGER NOT NULL DEFAULT 0,
  tx_hash               TEXT,
  ipfs_hash             TEXT,
  status                TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','confirmed')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. eco_credits
CREATE TABLE eco_credits (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  amount      INTEGER NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('earned','redeemed','bonus')),
  source      TEXT NOT NULL,
  device_id   UUID REFERENCES devices(id),
  disposal_id UUID REFERENCES disposals(id),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. compliance_flags
CREATE TABLE compliance_flags (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_type            TEXT NOT NULL CHECK (flag_type IN ('unauthorized_export','informal_collector','unverified_disposal','missing_owner')),
  device_id            UUID REFERENCES devices(id),
  reporter_id          UUID REFERENCES profiles(id),
  severity             TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  status               TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','resolved','dismissed')),
  description          TEXT NOT NULL,
  evidence_urls        TEXT[] NOT NULL DEFAULT '{}',
  stakeholders_looped  UUID[] NOT NULL DEFAULT '{}',
  resolved_by          UUID REFERENCES profiles(id),
  resolved_at          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. notifications
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  type       TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info','warning','action_required','success')),
  is_read    BOOLEAN NOT NULL DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. invitations (for institutional/government onboarding)
CREATE TABLE invitations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email       TEXT NOT NULL,
  role        user_role NOT NULL,
  organization TEXT NOT NULL,
  invited_by  UUID NOT NULL REFERENCES profiles(id),
  token       TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_profiles_supabase_uid      ON profiles(supabase_uid);
CREATE INDEX idx_profiles_privy_id          ON profiles(privy_id);
CREATE INDEX idx_profiles_wallet            ON profiles(wallet_address);
CREATE INDEX idx_user_roles_user_id         ON user_roles(user_id);
CREATE INDEX idx_devices_current_owner      ON devices(current_owner_id);
CREATE INDEX idx_devices_status             ON devices(status);
CREATE INDEX idx_devices_token_id           ON devices(token_id);
CREATE INDEX idx_devices_imei               ON devices(imei);
CREATE INDEX idx_lifecycle_device_id        ON device_lifecycle(device_id);
CREATE INDEX idx_lifecycle_created_at       ON device_lifecycle(created_at DESC);
CREATE INDEX idx_transfers_device_id        ON transfers(device_id);
CREATE INDEX idx_transfers_from_user        ON transfers(from_user_id);
CREATE INDEX idx_transfers_to_user          ON transfers(to_user_id);
CREATE INDEX idx_disposals_device_id        ON disposals(device_id);
CREATE INDEX idx_disposals_recycler_id      ON disposals(recycler_id);
CREATE INDEX idx_eco_credits_user_id        ON eco_credits(user_id);
CREATE INDEX idx_notifications_user_id      ON notifications(user_id);
CREATE INDEX idx_notifications_unread       ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_compliance_status          ON compliance_flags(status);
CREATE INDEX idx_compliance_severity        ON compliance_flags(severity);
CREATE INDEX idx_invitations_token          ON invitations(token);
CREATE INDEX idx_invitations_email          ON invitations(email);

-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices            ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_lifecycle   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposals          ENABLE ROW LEVEL SECURITY;
ALTER TABLE eco_credits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE recycler_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_flags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS HELPER FUNCTIONS (SECURITY DEFINER bypasses RLS)
-- ============================================================

-- Returns the profiles.id for the currently authenticated Supabase user
CREATE OR REPLACE FUNCTION auth_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT id FROM profiles WHERE supabase_uid = auth.uid() LIMIT 1
$$;

-- Returns true if the current user holds a verified instance of check_role
CREATE OR REPLACE FUNCTION has_role(check_role user_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth_profile_id()
      AND role = check_role
      AND is_verified = true
  )
$$;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── profiles ──────────────────────────────────────────────
CREATE POLICY "profiles: own read"
  ON profiles FOR SELECT
  USING (supabase_uid = auth.uid());

CREATE POLICY "profiles: privileged read"
  ON profiles FOR SELECT
  USING (has_role('regulator') OR has_role('admin') OR has_role('auditor'));

CREATE POLICY "profiles: own update"
  ON profiles FOR UPDATE
  USING (supabase_uid = auth.uid());

CREATE POLICY "profiles: service insert"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- ── user_roles ────────────────────────────────────────────
CREATE POLICY "user_roles: own read"
  ON user_roles FOR SELECT
  USING (user_id = auth_profile_id());

CREATE POLICY "user_roles: admin all"
  ON user_roles FOR ALL
  USING (has_role('admin'));

CREATE POLICY "user_roles: service insert"
  ON user_roles FOR INSERT
  WITH CHECK (true);

CREATE POLICY "user_roles: privileged read"
  ON user_roles FOR SELECT
  USING (has_role('regulator') OR has_role('auditor'));

-- ── devices ───────────────────────────────────────────────
CREATE POLICY "devices: owner read"
  ON devices FOR SELECT
  USING (current_owner_id = auth_profile_id() OR original_owner_id = auth_profile_id());

CREATE POLICY "devices: privileged read"
  ON devices FOR SELECT
  USING (has_role('regulator') OR has_role('auditor') OR has_role('admin') OR has_role('recycler') OR has_role('manufacturer'));

CREATE POLICY "devices: authenticated insert"
  ON devices FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "devices: owner update"
  ON devices FOR UPDATE
  USING (current_owner_id = auth_profile_id() OR has_role('admin') OR has_role('recycler'));

-- ── device_lifecycle ──────────────────────────────────────
CREATE POLICY "lifecycle: owner read"
  ON device_lifecycle FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_id
        AND (d.current_owner_id = auth_profile_id() OR d.original_owner_id = auth_profile_id())
    )
  );

CREATE POLICY "lifecycle: privileged read"
  ON device_lifecycle FOR SELECT
  USING (has_role('regulator') OR has_role('auditor') OR has_role('admin') OR has_role('recycler'));

CREATE POLICY "lifecycle: authenticated insert"
  ON device_lifecycle FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── transfers ─────────────────────────────────────────────
CREATE POLICY "transfers: parties read"
  ON transfers FOR SELECT
  USING (from_user_id = auth_profile_id() OR to_user_id = auth_profile_id());

CREATE POLICY "transfers: privileged read"
  ON transfers FOR SELECT
  USING (has_role('regulator') OR has_role('admin'));

CREATE POLICY "transfers: owner insert"
  ON transfers FOR INSERT
  WITH CHECK (from_user_id = auth_profile_id());

CREATE POLICY "transfers: parties update"
  ON transfers FOR UPDATE
  USING (to_user_id = auth_profile_id() OR from_user_id = auth_profile_id());

-- ── disposals ─────────────────────────────────────────────
CREATE POLICY "disposals: recycler manage"
  ON disposals FOR ALL
  USING (recycler_id = auth_profile_id() OR has_role('admin'));

CREATE POLICY "disposals: privileged read"
  ON disposals FOR SELECT
  USING (has_role('regulator') OR has_role('auditor'));

CREATE POLICY "disposals: device owner read"
  ON disposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM devices d
      WHERE d.id = device_id
        AND (d.current_owner_id = auth_profile_id() OR d.original_owner_id = auth_profile_id())
    )
  );

-- ── eco_credits ───────────────────────────────────────────
CREATE POLICY "eco_credits: own read"
  ON eco_credits FOR SELECT
  USING (user_id = auth_profile_id());

CREATE POLICY "eco_credits: admin read"
  ON eco_credits FOR SELECT
  USING (has_role('admin'));

CREATE POLICY "eco_credits: service insert"
  ON eco_credits FOR INSERT
  WITH CHECK (true);

-- ── recycler_facilities ───────────────────────────────────
CREATE POLICY "facilities: authenticated read"
  ON recycler_facilities FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "facilities: owner manage"
  ON recycler_facilities FOR ALL
  USING (owner_id = auth_profile_id());

CREATE POLICY "facilities: admin manage"
  ON recycler_facilities FOR ALL
  USING (has_role('admin'));

-- ── compliance_flags ──────────────────────────────────────
CREATE POLICY "flags: regulator manage"
  ON compliance_flags FOR ALL
  USING (has_role('regulator') OR has_role('admin'));

CREATE POLICY "flags: auditor read"
  ON compliance_flags FOR SELECT
  USING (has_role('auditor'));

CREATE POLICY "flags: authenticated insert"
  ON compliance_flags FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- ── notifications ─────────────────────────────────────────
CREATE POLICY "notifications: own read"
  ON notifications FOR SELECT
  USING (user_id = auth_profile_id());

CREATE POLICY "notifications: own update"
  ON notifications FOR UPDATE
  USING (user_id = auth_profile_id());

CREATE POLICY "notifications: service insert"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- ── invitations ───────────────────────────────────────────
CREATE POLICY "invitations: admin manage"
  ON invitations FOR ALL
  USING (has_role('admin'));

CREATE POLICY "invitations: public read by token"
  ON invitations FOR SELECT
  USING (true);

-- ============================================================
-- AUTO-CREATE PROFILE ON NEW AUTH USER
-- Fires when a new row is inserted into auth.users
-- (triggered by our Edge Function after Privy verification)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (supabase_uid, email, country, active_role)
  VALUES (NEW.id, NEW.email, 'Liberia', 'consumer')
  ON CONFLICT (supabase_uid) DO NOTHING;

  -- Grant every new user the consumer role by default
  INSERT INTO user_roles (user_id, role, is_verified)
  SELECT id, 'consumer', true
  FROM profiles
  WHERE supabase_uid = NEW.id
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- ============================================================
-- SEED: First admin user placeholder
-- After your first login, run this with YOUR profile id:
-- UPDATE user_roles SET role = 'admin', is_verified = true WHERE user_id = '<your-profile-id>';
-- UPDATE profiles SET active_role = 'admin' WHERE id = '<your-profile-id>';
-- ============================================================
