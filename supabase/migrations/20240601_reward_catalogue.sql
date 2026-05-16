-- ── Reward catalogue (admin-managed) ─────────────────────────────────────────
create table if not exists reward_catalogue (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  partner     text        not null,
  category    text        not null default 'General',
  cost_ec     integer     not null check (cost_ec > 0),
  image_url   text,
  description text,
  stock       integer,                -- null = unlimited
  is_active   boolean     not null default true,
  created_at  timestamptz not null default now()
);

-- ── Redemptions (consumer places, admin fulfills) ──────────────────────────
create table if not exists redemptions (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references profiles(id) on delete cascade,
  catalogue_item_id uuid        not null references reward_catalogue(id),
  item_title        text        not null,   -- snapshot at redemption time
  item_partner      text        not null,
  ec_cost           integer     not null,
  status            text        not null default 'pending'
                                check (status in ('pending','fulfilled','failed')),
  notes             text,
  fulfilled_by      uuid        references profiles(id),
  fulfilled_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- ── Seed default catalogue items ──────────────────────────────────────────
insert into reward_catalogue (title, partner, category, cost_ec, description) values
  ('LRD 500 mobile airtime',       'Lonestar / Orange MTN',  'Mobile money',  250, 'Top up any Liberian number instantly after admin approval.'),
  ('LRD 1,000 grocery voucher',    'Monrovia Central Market','Grocery',        500, 'Digital voucher redeemable at partner market locations.'),
  ('Off-grid solar lantern',        'SolarAid Liberia',       'Green energy',   900, 'A d.light solar lamp delivered to your address.'),
  ('Tree planted in your name',     'FDA Liberia',            'Conservation',   120, 'We plant a tree in Liberia''s reforestation zone on your behalf.'),
  ('20% off next device repair',    'EcoLedger Partner',      'OEM partner',    400, 'Discount code for any certified repair partner in our network.'),
  ('EcoFund donation match',        'EcoFund Liberia NGO',    'Charity',         50, 'Your credits are matched and donated to e-waste education programs.');
