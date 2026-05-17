# Liberia EcoLedger

> Blockchain-powered electronic waste tracking and Extended Producer Responsibility (EPR) platform for the Republic of Liberia.

**Live platform:** https://liberiaecoledger.vercel.app  
**Network:** Ethereum Sepolia Testnet  
**Built for:** UN Sustainable Development Goals 12, 13, 3, 11

---

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Smart Contracts](#smart-contracts)
5. [Database Schema](#database-schema)
6. [User Roles](#user-roles)
7. [Key Workflows](#key-workflows)
8. [Edge Functions](#edge-functions)
9. [Authentication](#authentication)
10. [Mobile App](#mobile-app)
11. [Public Website](#public-website)
12. [Environment Variables](#environment-variables)
13. [Local Development](#local-development)
14. [Deployment](#deployment)
15. [Project Structure](#project-structure)

---

## Overview

EcoLedger is a full-stack web platform that creates an immutable, auditable record of every electronic device's lifecycle in Liberia — from manufacture or import, through ownership transfers, to certified disposal. It implements Liberia's Extended Producer Responsibility (EPR) framework on-chain and rewards consumers with EcoCredits for responsible e-waste disposal.

**Core principles:**
- Every device event (registration, transfer, disposal) is recorded on the Ethereum blockchain
- Manufacturers are held accountable for the end-of-life of devices they produce or import
- Certified recyclers log disposals and the smart contract automatically mints EcoCredits to device owners
- EPA Liberia regulators have real-time national visibility and court-ready evidence trails
- NGOs and auditors have read-only access to the full dataset for independent verification

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  Web Dashboard (React/Vite)    Mobile PWA (React/Vite)      │
│  Public Website (React/Vite)                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│                    VERCEL CDN                                 │
│              Static site hosting + edge                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
          ┌─────────────┴──────────────┐
          │                            │
┌─────────▼──────────┐    ┌────────────▼───────────────────┐
│   SUPABASE          │    │   ETHEREUM (Sepolia Testnet)   │
│                     │    │                                │
│  PostgreSQL DB      │    │  EcoToken.sol (ERC-20)         │
│  Row Level Security │    │  0xffEA92d...1B4               │
│  Auth (JWT)         │    │                                │
│  Edge Functions:    │    │  EcoLedger.sol (Registry)      │
│  - privy-auth       │    │  0xb4Fa81E...2E                │
│  - public-stats     │    │                                │
│  - relay-tx         │    │  Operator wallet relays txns   │
│  - notify           │    │  (users need no gas)           │
└─────────────────────┘    └────────────────────────────────┘
          │
┌─────────▼──────────┐
│   PRIVY             │
│  Wallet + Email     │
│  Authentication     │
│  Embedded wallets   │
└─────────────────────┘
```

### Architecture Decisions

| Decision | Rationale |
|---|---|
| **Operator/relay pattern** | Users in Liberia do not hold ETH. A backend operator wallet pays gas and calls the smart contract on their behalf. |
| **Supabase RLS** | Every database query is scoped to the authenticated user's role via Row Level Security policies. No client-side filtering is trusted. |
| **Privy for auth** | Supports both email (for non-crypto users) and wallet login. Generates embedded wallets for users who don't have one. |
| **Sepolia testnet** | Production-equivalent environment without real ETH cost. Contract addresses and ABI are identical to what a mainnet deployment would use. |
| **Edge functions for secrets** | Service role key and operator private key never reach the client. All privileged operations go through Supabase Edge Functions (Deno). |

---

## Tech Stack

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v7 |
| State / data fetching | TanStack Query v5 |
| Charts | Recharts |
| Animations | Framer Motion |
| QR scanning | html5-qrcode, jsqr |
| QR generation | react-qr-code |
| Blockchain client | ethers.js v6 |
| Toast notifications | Sonner |

### Backend
| Layer | Technology |
|---|---|
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth + Privy |
| Edge Functions | Deno (TypeScript) |
| File storage | Supabase Storage |
| Real-time | Supabase Realtime (webhooks → notify fn) |

### Blockchain
| Layer | Technology |
|---|---|
| Network | Ethereum Sepolia (Chain ID: 11155111) |
| Smart contracts | Solidity |
| Development | Hardhat |
| Token standard | ERC-20 (EcoToken) |

### Infrastructure
| Layer | Technology |
|---|---|
| Hosting | Vercel |
| CI/CD | Vercel GitHub integration (auto-deploy on push to main) |
| Domain | liberiaecoledger.vercel.app |

---

## Smart Contracts

Both contracts are deployed on Ethereum Sepolia testnet.

### EcoToken — `0xffEA92d6399B191A0e406EF2647cBA2445c821B4`

An ERC-20 token representing EcoCredits. Minted by the EcoLedger registry contract when a certified recycler confirms a disposal event.

- **Symbol:** ECO
- **Decimals:** 18
- **Minting:** Only callable by the EcoLedger registry contract (operator-controlled)
- **Use:** Redeemable in the EcoCredits marketplace for goods and services

### EcoLedger Registry — `0xb4Fa81E6D8985FE0CbA4285Ce19e81642155872E`

The core registry contract. Records all device lifecycle events on-chain.

- **registerDevice(deviceId, manufacturer, hazardClass)** — called when a manufacturer registers a device
- **transferDevice(deviceId, newOwner)** — records ownership change
- **logDisposal(deviceId, recyclerId, ownerAddress, ecoCredits)** — records certified disposal and triggers EcoToken mint
- **Operator pattern:** The deployer wallet (`0x5c0C2e3ff975d3A3932c129400D7b260F59B3F8F`) acts as operator — all on-chain writes go through the `relay-tx` edge function which uses the operator private key

### Operator / Relay Pattern

```
User action in browser
        │
        ▼
relay-tx Edge Function (Supabase)
        │  signs transaction with OPERATOR_PRIVATE_KEY
        ▼
Ethereum Sepolia RPC
        │
        ▼
EcoLedger.sol / EcoToken.sol
```

Users never need ETH or a funded wallet. The operator wallet covers all gas costs.

---

## Database Schema

All tables live in Supabase PostgreSQL with Row Level Security enforced on every table.

### Core Tables

```
profiles
  id            uuid (references auth.users)
  full_name     text
  role          text  (consumer | manufacturer | recycler | regulator | auditor | admin)
  org_name      text
  created_at    timestamptz

devices
  id            uuid
  imei          text (unique)
  model         text
  brand         text
  hazard_class  text
  manufacturer_id uuid (references profiles)
  owner_id      uuid (references profiles)
  status        text (registered | transferred | disposed)
  on_chain_tx   text (transaction hash)
  created_at    timestamptz

disposals
  id            uuid
  device_id     uuid (references devices)
  recycler_id   uuid (references profiles)
  owner_id      uuid (references profiles)
  eco_credits   numeric
  on_chain_tx   text
  disposed_at   timestamptz

compliance_flags
  id            uuid
  device_id     uuid (references devices)
  raised_by     uuid (references profiles)
  severity      text (low | medium | high | critical)
  status        text (open | investigating | escalated | resolved)
  description   text
  evidence      jsonb
  created_at    timestamptz

recyclers
  id            uuid (references profiles)
  facility_name text
  county        text
  address       text
  licence_number text
  hazard_classes text[]
  verified      boolean
  lat           numeric
  lng           numeric

reward_catalogue
  id            uuid
  title         text
  partner       text
  cost_ec       numeric
  image_url     text
  active        boolean

redemptions
  id            uuid
  profile_id    uuid (references profiles)
  item_id       uuid (references reward_catalogue)
  item_title    text
  item_partner  text
  ec_cost       numeric
  redeemed_at   timestamptz

notifications
  id            uuid
  profile_id    uuid (references profiles)
  title         text
  body          text
  read          boolean
  created_at    timestamptz
```

### RLS Policy Pattern

```sql
-- Example: consumers can only read their own devices
CREATE POLICY "consumers_own_devices"
ON devices FOR SELECT
USING (owner_id = auth_profile_id());

-- Regulators can read all devices
CREATE POLICY "regulators_read_all"
ON devices FOR SELECT
USING (has_role('regulator') OR has_role('admin'));
```

Helper functions used throughout RLS:
- `has_role(role text)` — returns true if the authenticated user's profile has that role
- `auth_profile_id()` — returns the profile UUID linked to the current auth.users session

---

## User Roles

| Role | Dashboard path | Description |
|---|---|---|
| **Consumer** | `/consumer` | Registers devices, tracks lifecycle, earns and redeems EcoCredits |
| **Manufacturer** | `/manufacturer` | Registers products, views EPR compliance analytics |
| **Recycler** | `/recycler` | Logs disposals via web or mobile app, manages facility profile |
| **Regulator** | `/regulator` | National compliance map, flags management, county analytics, reports |
| **Auditor** | `/auditor` | Read-only block explorer, verified records, on-chain transaction verification |
| **Admin** | `/admin` | User management, invitations, rewards catalogue, smart contract monitoring |

Access is invite-only. Admin sends an invitation → user clicks the secure link → sets up their account with the correct role pre-assigned.

---

## Key Workflows

### 1. Device Registration

```
Manufacturer logs into dashboard
  → Fills in device details (IMEI, model, hazard class)
  → Frontend calls Supabase: INSERT into devices
  → relay-tx Edge Function called: registerDevice() on EcoLedger.sol
  → On-chain tx hash stored back in devices.on_chain_tx
  → QR code generated from device ID for physical labelling
```

### 2. Device Transfer (Ownership Change)

```
Consumer scans device QR code
  → Transfer request created in Supabase
  → New owner accepts
  → relay-tx called: transferDevice() on EcoLedger.sol
  → devices.owner_id updated, on_chain_tx recorded
```

### 3. Certified Disposal + EcoCredit Issuance

```
Consumer brings device to certified recycler
  → Recycler scans device QR on mobile app
  → Recycler confirms disposal: INSERT into disposals
  → relay-tx called: logDisposal() on EcoLedger.sol
  → EcoLedger.sol calls EcoToken.mint(ownerAddress, ecoCredits)
  → EcoCredits appear in consumer's wallet and dashboard
  → Device status set to 'disposed'
  → Notification sent to consumer
```

### 4. Compliance Flag

```
Regulator identifies a violation
  → Raises flag on device: INSERT into compliance_flags
  → Assigns severity (low / medium / high / critical)
  → Uploads evidence to evidence locker
  → Can escalate to Attorney General
  → Flag status tracked: open → investigating → escalated → resolved
```

### 5. EcoCredits Redemption

```
Consumer views reward catalogue
  → Selects reward (e.g. mobile data, grocery voucher)
  → INSERT into redemptions
  → EcoCredits balance deducted from profile
  → Confirmation shown; partner fulfils reward off-platform
```

---

## Edge Functions

All edge functions are deployed to Supabase and written in Deno/TypeScript.

| Function | Trigger | Purpose |
|---|---|---|
| `privy-auth` | HTTP POST | Exchanges a Privy JWT for a Supabase JWT. Bridges Privy authentication into the Supabase auth system. |
| `public-stats` | HTTP GET | Returns aggregated platform statistics (device count, recycler count, lifecycle events, EcoCredits issued) for the public landing page. Uses the service role key to bypass RLS. |
| `relay-tx` | HTTP POST | Signs and broadcasts Ethereum transactions on behalf of users using the operator private key. Accepts `method` + `params`, constructs the tx, submits to Sepolia RPC, returns the tx hash. |
| `notify` | Database webhook | Triggered by Supabase webhooks on `devices` and `compliance_flags` UPDATE events. Inserts a notification record for the relevant profile. |

---

## Authentication

EcoLedger uses a two-layer authentication system:

```
User (email or wallet)
        │
        ▼
   Privy SDK (frontend)
        │  issues Privy JWT
        ▼
privy-auth Edge Function
        │  verifies Privy JWT, looks up or creates profile
        │  issues Supabase JWT
        ▼
Supabase Auth session
        │  used for all DB queries (RLS checks this session)
        ▼
PostgreSQL RLS policies
```

- **Email login** — standard email + password via Privy
- **Wallet login** — MetaMask or Privy embedded wallet
- **Institutional login** — access code system for regulators and auditors who receive a code via their department head
- **Invited users** — admin sends an invitation link; first login goes through `/setup-account` to set name and password

---

## Mobile App

A Progressive Web App (PWA) optimised for field recyclers. Accessible at `/mobile`.

**Features:**
- QR code scanner to identify devices
- Disposal logging workflow (scan → confirm hazard class → submit)
- Device transfer flow
- Rewards catalogue and redemption
- Offline-tolerant design for low-connectivity environments

**Key pages:**
- `/mobile` — scan home
- `/mobile/scan` — QR scanner
- `/mobile/dispose` — log a disposal
- `/mobile/transfer` — transfer device ownership
- `/mobile/rewards` — EcoCredits and reward catalogue
- `/mobile/devices` — recycler's logged device history

---

## Public Website

All public-facing pages share a consistent `LandingNav` and `LandingFooter`.

| Section | Route |
|---|---|
| Landing page | `/` |
| **Platform** | |
| For Consumers | `/platform/consumers` |
| For Manufacturers | `/platform/manufacturers` |
| For Recyclers | `/platform/recyclers` |
| For Regulators | `/platform/regulators` |
| For Public & Auditors | `/platform/auditors` |
| **Stakeholders** | |
| Request Access | `/stakeholders/request-access` |
| Recycler Onboarding | `/stakeholders/recycler-onboarding` |
| Regulator Portal | `/stakeholders/regulator-portal` |
| NGO Partnerships | `/stakeholders/ngo-partnerships` |
| Board of Directors | `/stakeholders/board` |
| **Resources** | |
| Whitepaper | `/whitepaper` |
| API Documentation | `/api-docs` |
| Block Explorer | `/block-explorer` |
| Press Kit | `/press-kit` |
| Changelog | `/changelog` |
| **Legal** | |
| Privacy Policy | `/privacy` |
| Terms of Service | `/terms` |
| Cookie Policy | `/cookies` |
| Code of Ethics | `/ethics` |
| GDPR Compliance | `/gdpr` |

---

## Environment Variables

Create a `.env` file at the project root:

```env
# Supabase
VITE_SUPABASE_URL=https://ihjooawueqocqpmdbjwi.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Privy
VITE_PRIVY_APP_ID=your_privy_app_id

# Ethereum
VITE_ECOTOKEN_ADDRESS=0xffEA92d6399B191A0e406EF2647cBA2445c821B4
VITE_ECOLEDGER_ADDRESS=0xb4Fa81E6D8985FE0CbA4285Ce19e81642155872E
VITE_RPC_URL=https://sepolia.infura.io/v3/your_key
```

Supabase Edge Function secrets (set via Supabase dashboard → Settings → Edge Functions):

```
SUPABASE_SERVICE_ROLE_KEY   — bypasses RLS for admin/public operations
OPERATOR_PRIVATE_KEY        — Ethereum wallet that pays gas and signs txns
PRIVY_APP_SECRET            — verifies Privy JWTs in privy-auth function
```

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy edge functions (requires Supabase CLI)
npx supabase functions deploy public-stats --project-ref ihjooawueqocqpmdbjwi
npx supabase functions deploy relay-tx --project-ref ihjooawueqocqpmdbjwi
npx supabase functions deploy privy-auth --project-ref ihjooawueqocqpmdbjwi
npx supabase functions deploy notify --project-ref ihjooawueqocqpmdbjwi

# Deploy smart contracts (requires funded Sepolia wallet)
cd contracts
npx hardhat run scripts/deploy.js --network sepolia
```

---

## Deployment

The platform is deployed on **Vercel** with automatic deployments triggered by every push to the `main` branch on GitHub.

```
git push origin main
      │
      ▼
GitHub → Vercel webhook
      │
      ▼
Vercel builds (npm run build)
      │
      ▼
Static files deployed to Vercel CDN
      │
      ▼
Live at liberiaecoledger.vercel.app
```

**Smart contracts** are deployed to Sepolia testnet via Hardhat. Contract addresses are stored in `contracts/deployments.json` and referenced as `VITE_` environment variables in the frontend.

**Edge functions** are deployed to Supabase and versioned independently of the frontend.

---

## Project Structure

```
liberiaecoledger/
├── contracts/                  # Hardhat smart contract project
│   ├── sol/
│   │   ├── EcoToken.sol        # ERC-20 EcoCredits token
│   │   └── EcoLedger.sol       # Device registry contract
│   ├── scripts/
│   │   └── deploy.js
│   ├── deployments.json        # Deployed contract addresses
│   └── hardhat.config.js
│
├── supabase/
│   ├── functions/
│   │   ├── privy-auth/         # Privy → Supabase JWT bridge
│   │   ├── public-stats/       # Public platform statistics
│   │   ├── relay-tx/           # Ethereum transaction relay
│   │   └── notify/             # In-app notification trigger
│   └── migrations/             # SQL migration files
│
├── src/
│   ├── components/
│   │   ├── landing/
│   │   │   ├── LandingNav.tsx
│   │   │   └── LandingFooter.tsx
│   │   ├── ScrollToTop.tsx
│   │   └── ui/
│   │
│   ├── hooks/
│   │   └── useAuth.ts          # Auth state, role, profile
│   │
│   ├── layouts/
│   │   ├── AuthLayout.tsx
│   │   ├── DashboardLayout.tsx
│   │   └── MobileLayout.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client
│   │   ├── contracts.ts        # ethers.js contract instances
│   │   ├── auth.ts             # Auth helpers
│   │   └── pinata.ts           # IPFS pinning (metadata)
│   │
│   ├── pages/
│   │   ├── admin/              # Admin dashboard
│   │   ├── auditor/            # Auditor block explorer
│   │   ├── auth/               # Login, setup, role select
│   │   ├── consumer/           # Device management, EcoCredits
│   │   ├── landing/            # Public landing page
│   │   ├── legal/              # Privacy, Terms, Cookies, Ethics, GDPR
│   │   ├── manufacturer/       # Product catalogue, analytics
│   │   ├── mobile/             # PWA for field recyclers
│   │   ├── platform/           # Platform explainer pages
│   │   ├── recycler/           # Disposal logging, facility
│   │   ├── regulator/          # Compliance map, flags, reports
│   │   ├── resources/          # Whitepaper, API docs, etc.
│   │   ├── shared/             # Account settings, notifications
│   │   └── stakeholders/       # Request access, board, etc.
│   │
│   ├── routes/                 # Route groupings per role
│   ├── types/
│   │   └── database.ts         # Supabase TypeScript types
│   └── App.tsx                 # Root router
│
├── public/                     # Static assets
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## Contact

**Support:** support@liberiaecoledger.com  
**Foundation:** EcoLedger Foundation, Monrovia, Liberia, West Africa  
**GitHub:** https://github.com/Dubai-lab/liberiaecoledger

---

*Built to support Liberia's e-waste regulatory framework and the Basel Convention on the Control of Transboundary Movements of Hazardous Wastes.*
