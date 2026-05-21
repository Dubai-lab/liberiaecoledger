# CHAPTER 4: ANALYSIS AND DESIGN OF THE PROPOSED SYSTEM

---

## 4.1 Introduction

This chapter presents the complete system analysis and design for EcoLedger. Building on the problem analysis and feasibility conclusions of Chapter 3, it specifies what the system must do and how it must be structured. The chapter establishes the development methodology, defines functional and non-functional requirements, documents the system architecture, presents UML diagrams modelling system behavior, provides the Data Dictionary, and specifies hardware and software requirements.

---

## 4.2 Development Methodology

### 4.2.1 Selected Methodology: OOADM

The Object-Oriented Analysis and Design Methodology (OOADM) was selected as the development framework for EcoLedger. OOADM structures analysis and design around objects — discrete entities encapsulating data (attributes) and behavior (methods) — and models the system using Unified Modeling Language (UML) diagrams. This methodology is well-suited to EcoLedger because the React framework on which the frontend is built is inherently component-based and object-oriented, each user role maps naturally to an actor object, and devices, events, and credits are data objects with defined attributes and methods. OOADM's support for iterative and incremental development also aligned with the practical need to validate integration between the web application, Supabase, and the Ethereum blockchain at each phase.

The alternative methodology available under UNILAK guidelines — SSADM — uses Data Flow Diagrams and Structure Charts suited to process-oriented, functionally decomposed systems. EcoLedger's object-oriented architecture makes OOADM the methodologically correct choice.

### 4.2.2 Development Tools

| Tool | Purpose |
|---|---|
| React 18 + TypeScript | Frontend component development |
| Tailwind CSS | Utility-first styling framework |
| Vite | Build tool and development server |
| Supabase | Backend: PostgreSQL, Auth, RLS, Edge Functions |
| Solidity | Smart contract language |
| Hardhat | Contract compilation, testing, deployment |
| Privy SDK | Embedded blockchain wallet management |
| Vercel | Frontend cloud hosting and CI/CD |
| jsQR | QR code JavaScript decoding library |

---

## 4.3 Functional Requirements

### Consumer

| ID | Requirement |
|---|---|
| FR-C01 | Consumer can create an account using email and password |
| FR-C02 | Consumer can register a device (brand, model, category, serial number; IMEI for smartphones/tablets) |
| FR-C03 | System generates a unique QR code per device for download |
| FR-C04 | System awards 10 EcoCredits upon successful device registration |
| FR-C05 | Consumer dashboard displays all registered devices with current lifecycle status |
| FR-C06 | Consumer can submit a registered device for recycling |
| FR-C07 | Consumer can view EcoCredits balance and transaction history |
| FR-C08 | Registration events are anchored on the Ethereum Sepolia blockchain |

### Recycler

| ID | Requirement |
|---|---|
| FR-R01 | Recycler accounts are created only via administrator email invitation |
| FR-R02 | Recycler dashboard displays an intake queue of submitted devices |
| FR-R03 | Recycler can confirm device receipt, updating status to "Received by Recycler" |
| FR-R04 | Recycler can update device status through Processing and Recycling Complete |
| FR-R05 | Recycler can identify devices via mobile QR scan or manual identifier entry |
| FR-R06 | Recycler status updates are anchored on the Ethereum Sepolia blockchain |

### Inspector

| ID | Requirement |
|---|---|
| FR-I01 | Inspector accounts are created only via administrator email invitation |
| FR-I02 | Inspector can view all registered devices across all consumers |
| FR-I03 | Inspector can view the complete lifecycle event history of any device |
| FR-I04 | Inspector can view and verify the on-chain transaction hash for each anchored event |
| FR-I05 | Inspector can use the mobile scanning interface to look up any device |

### Administrator

| ID | Requirement |
|---|---|
| FR-A01 | Administrator can invite users by email and assign roles (Recycler, Inspector, Administrator) |
| FR-A02 | Administrator has access to the full device registry |
| FR-A03 | Administrator can view and manage all user accounts and roles |
| FR-A04 | Administrator has a system analytics dashboard showing total devices, recycling events, and EcoCredits |

---

## 4.4 Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | Performance | Consumer dashboard loads within 3 seconds on a 3G mobile connection |
| NFR-02 | Performance | QR code detected within 2 seconds of entering the camera frame |
| NFR-03 | Security | Passwords stored as bcrypt hashes; sessions managed via JWT tokens |
| NFR-04 | Security | Database access enforced by Row Level Security; no user reads outside their scope |
| NFR-05 | Security | Private keys managed by Privy; never exposed to the application server |
| NFR-06 | Data Integrity | Blockchain events stored with SHA-256 hash of payload; alteration detectable |
| NFR-07 | Scalability | Architecture supports 100,000+ devices and 500 concurrent users without modification |
| NFR-08 | Usability | All primary workflows completable within 5 steps from the role dashboard |
| NFR-09 | Compatibility | Fully functional on Chrome, Firefox, Safari (iOS 14+), and Edge |

---

## 4.5 System Architecture

EcoLedger uses a three-layer architecture separating the user interface, application data, and blockchain persistence layers. The React/TypeScript frontend is deployed on Vercel and communicates with Supabase via REST and WebSocket APIs. The Supabase backend provides PostgreSQL data storage, authentication, Row Level Security enforcement, and Edge Functions for server-side operations including blockchain transaction dispatch. Critical lifecycle events are anchored on the Ethereum Sepolia testnet via Solidity smart contracts. Privy embedded wallets bridge the frontend to the blockchain layer, handling wallet creation and transaction signing transparently without exposing any cryptocurrency complexity to end users.

[DIAGRAM: Three-layer architecture — Layer 1: React/TypeScript app on Vercel (user browser); Layer 2: Supabase (PostgreSQL + RLS + Auth + Edge Functions); Layer 3: Ethereum Sepolia smart contracts; Privy SDK shown as side component bridging Layer 1 to Layer 3; arrows showing HTTPS between browser and Vercel, REST/WebSocket between Vercel and Supabase, JSON-RPC between Edge Functions and Sepolia]

---

## 4.6 Use Case Diagram

[DIAGRAM: UML Use Case Diagram — system boundary box labeled "EcoLedger"; four external actors: Consumer (left), Recycler (left), Inspector (right), Administrator (right); Consumer use cases: Register Account, Register Device, Download QR Code, Submit for Recycling, View EcoCredits; Recycler use cases: Accept Intake, Update Processing Status, Mark Recycling Complete, Scan QR Code; Inspector use cases: View All Devices, View Device Lifecycle, Verify Blockchain Record, Scan QR Code; Administrator use cases: Invite User, Manage Roles, View Analytics; shared use case "Scan QR Code" connected with include arrows to both Recycler and Inspector]

### Use Case Description — UC-01: Register Device

| Field | Detail |
|---|---|
| Actor | Consumer |
| Precondition | Consumer is authenticated |
| Flow | 1. Consumer selects "Register New Device" → 2. Enters brand, model, category → 3. If Smartphone/Tablet, enters IMEI → 4. Enters serial number → 5. Submits form → 6. System creates device record in Supabase → 7. Edge Function anchors event on blockchain → 8. System awards 10 EcoCredits → 9. QR code generated and presented |
| Post-condition | Device visible in dashboard; QR code downloadable; EcoCredits credited |

### Use Case Description — UC-02: Accept Device Intake

| Field | Detail |
|---|---|
| Actor | Recycler |
| Precondition | Recycler is authenticated; device status is "Submitted for Recycling" |
| Flow | 1. Recycler views intake queue or scans QR code → 2. Selects "Accept Intake" → 3. System updates status to "Received by Recycler" → 4. System anchors intake event on blockchain with recycler identity and timestamp |
| Post-condition | Device moves to recycler's active processing list; blockchain record created |

---

## 4.7 Activity Diagram

[DIAGRAM: UML Activity Diagram for Device Registration — swimlanes: Consumer (left) and System (right); flow: START → Consumer selects Register Device → fills form → Decision: Smartphone/Tablet? → YES: IMEI field shown → Consumer enters IMEI → enters serial number → submits → Decision: validation passed? → NO: error shown, loop back → YES: System creates Supabase record → dispatches blockchain transaction → awards EcoCredits → generates QR code → Consumer downloads QR → END]

---

## 4.8 Sequence Diagram

[DIAGRAM: UML Sequence Diagram for Device Registration — participants left to right: Consumer Browser, React Frontend, Supabase API, Supabase Edge Function, Ethereum Sepolia; sequence: (1) Consumer submits form → React Frontend; (2) React Frontend → Supabase API: INSERT device record; (3) Supabase API → React Frontend: device UUID; (4) React Frontend → Edge Function: triggerBlockchainLog(deviceId, "REGISTERED", dataHash); (5) Edge Function → Ethereum Sepolia: logEvent() signed via Privy wallet; (6) Ethereum Sepolia → Edge Function: txHash; (7) Edge Function → Supabase API: UPDATE blockchain_tx_hash; (8) Edge Function → Supabase API: INSERT eco_credits +10; (9) React Frontend → Consumer Browser: show QR code + EcoCredits notification]

---

## 4.9 Class Diagram

[DIAGRAM: UML Class Diagram — five classes with attributes and methods:
UserProfile (id:UUID, email:String, full_name:String, role:Enum, created_at:Timestamp | getDevices(), getEcoCreditsBalance());
Device (id:UUID, consumer_id:UUID, brand:String, model:String, category:String, serial_number:String, imei:String[null], status:Enum, blockchain_tx_hash:String[null], created_at:Timestamp | updateStatus(), generateQRCode());
DeviceLifecycleEvent (id:UUID, device_id:UUID, event_type:String, actor_id:UUID, actor_role:String, blockchain_tx_hash:String[null], created_at:Timestamp | anchorOnChain());
EcoCredit (id:UUID, consumer_id:UUID, device_id:UUID, amount:Integer, reason:String, created_at:Timestamp | getBalance());
Invitation (id:UUID, email:String, role:String, token:String, invited_by:UUID, used:Boolean, created_at:Timestamp | send(), consume());
Relationships: UserProfile 1→* Device; Device 1→* DeviceLifecycleEvent; Device 1→* EcoCredit; UserProfile 1→* EcoCredit]

---

## 4.10 Database Design

### 4.10.1 Entity-Relationship Diagram

[DIAGRAM: ERD showing five entities — PROFILES, DEVICES, DEVICE_LIFECYCLE_EVENTS, ECO_CREDITS, INVITATIONS — with primary keys underlined, foreign keys marked with FK notation, and crow's foot cardinality notation: PROFILES(1)→(many)DEVICES via consumer_id; DEVICES(1)→(many)DEVICE_LIFECYCLE_EVENTS via device_id; DEVICES(1)→(many)ECO_CREDITS via device_id; PROFILES(1)→(many)ECO_CREDITS via consumer_id; PROFILES(1)→(many)INVITATIONS via invited_by]

### 4.10.2 Row Level Security Policies

Supabase Row Level Security (RLS) enforces role-based access at the database tier independently of application logic:

- **profiles:** Users read only their own row; Administrators read all rows.
- **devices:** Consumers read/insert their own records only; Recyclers, Inspectors, and Administrators read all records; Recyclers update device status; Administrators update all fields.
- **device_lifecycle_events:** Read access mirrors device access rules; no user can update or delete event records.
- **eco_credits:** Consumers read their own records; INSERT is restricted to server-side Edge Functions with service-role privileges, preventing client-side self-award.
- **invitations:** Administrators read and insert; token field never returned to client queries.

---

## 4.11 Data Dictionary

The Data Dictionary defines the structure of every table in the EcoLedger PostgreSQL database, including column names, data types, constraints, and descriptions.

### Table 1: profiles

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY | References auth.users(id); Supabase Auth user ID |
| email | TEXT | NOT NULL, UNIQUE | User email address |
| full_name | TEXT | NOT NULL | User full name |
| role | TEXT | NOT NULL, CHECK IN ('consumer', 'recycler', 'inspector', 'admin') | Role governing system access |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Account creation timestamp |

### Table 2: devices

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique device identifier encoded in QR code |
| consumer_id | UUID | NOT NULL, FK → profiles(id) | Consumer who registered the device |
| brand | TEXT | NOT NULL | Device manufacturer/brand name |
| model | TEXT | NOT NULL | Device model designation |
| category | TEXT | NOT NULL | Device category (Smartphone, Tablet, Laptop, Desktop, Other) |
| serial_number | TEXT | | Manufacturer serial number |
| imei | TEXT | | IMEI number (Smartphone and Tablet only) |
| status | TEXT | NOT NULL, DEFAULT 'registered' | Current lifecycle status |
| blockchain_tx_hash | TEXT | | Ethereum transaction hash of most recent on-chain event |
| qr_code_url | TEXT | | URL of generated QR code image |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Device registration timestamp |

**Device Status Values:**

| Status | Meaning |
|---|---|
| registered | Device registered by consumer |
| submitted_for_recycling | Consumer has submitted device for recycling |
| received_by_recycler | Recycler confirmed physical receipt |
| processing | Recycler has begun processing |
| recycling_complete | Recycler certified recycling is complete |
| ready_for_disposal | Marked for final disposal by inspector |

### Table 3: device_lifecycle_events

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique event record identifier |
| device_id | UUID | NOT NULL, FK → devices(id) | Device this event pertains to |
| event_type | TEXT | NOT NULL | Type of event (REGISTERED, SUBMITTED, INTAKE_CONFIRMED, PROCESSING, RECYCLING_COMPLETE) |
| actor_id | UUID | NOT NULL, FK → profiles(id) | User who performed the action |
| actor_role | TEXT | NOT NULL | Role of the actor at time of event |
| notes | TEXT | | Optional notes added by the actor |
| blockchain_tx_hash | TEXT | | Ethereum transaction hash if event was anchored on-chain |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Event timestamp |

### Table 4: eco_credits

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique credit record identifier |
| consumer_id | UUID | NOT NULL, FK → profiles(id) | Consumer receiving the credits |
| device_id | UUID | NOT NULL, FK → devices(id) | Device for which credits were awarded |
| amount | INTEGER | NOT NULL | Number of EcoCredits awarded (default: 10 per registration) |
| reason | TEXT | NOT NULL | Reason for credit award (e.g., "Device registration") |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Credit award timestamp |

### Table 5: invitations

| Column | Data Type | Constraints | Description |
|---|---|---|---|
| id | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique invitation identifier |
| email | TEXT | NOT NULL | Email address of the invitee |
| role | TEXT | NOT NULL | Role assigned upon account creation |
| token | TEXT | NOT NULL, UNIQUE | Secure token embedded in invitation link |
| invited_by | UUID | NOT NULL, FK → profiles(id) | Administrator who issued the invitation |
| used | BOOLEAN | NOT NULL, DEFAULT false | Whether invitation has been accepted |
| created_at | TIMESTAMPTZ | NOT NULL, DEFAULT now() | Invitation creation timestamp |

---

## 4.12 Smart Contract Design

The EcoLedger Solidity smart contract is deployed on Ethereum Sepolia and serves as an immutable append-only audit ledger. It stores only what is necessary to provide cryptographic proof of a lifecycle event — not the full device dataset, which remains in Supabase for performance.

```
Contract: EcoLedger  |  Network: Ethereum Sepolia  |  Compiler: Solidity ^0.8.19

Struct DeviceEvent:
  eventType : string    — e.g., "REGISTERED", "RECYCLING_COMPLETE"
  dataHash  : bytes32   — SHA-256 hash of full event payload from Supabase
  timestamp : uint256   — block.timestamp at time of recording
  actor     : address   — Privy wallet address of the signing user

State: mapping(string => DeviceEvent[])  — deviceId → events array

Functions:
  logEvent(deviceId, eventType, dataHash)  — records event; emits EventLogged
  getEvents(deviceId)                       — returns full event array for a device
```

When a critical lifecycle event occurs, the Supabase Edge Function computes a SHA-256 hash of the event JSON payload, submits a signed `logEvent` transaction to the contract, and stores the returned transaction hash in Supabase. Inspectors can later call `getEvents` and compare on-chain hashes with freshly computed Supabase hashes to verify data integrity.

---

## 4.13 Hardware and Software Specifications

### Client Requirements

| Specification | Minimum | Recommended |
|---|---|---|
| Device | Smartphone or Computer | Smartphone (Android or iOS) |
| Browser | Chrome 80+, Firefox 80+, Safari 14+, Edge 80+ | Chrome 110+ or Safari 16+ |
| Internet | 3G mobile data (1 Mbps) | 4G/LTE or Wi-Fi |
| Camera | Rear-facing (for QR scanning) | Rear-facing, 8MP minimum |

### Server and Infrastructure

| Component | Specification |
|---|---|
| Frontend Hosting | Vercel (Pro tier for production) |
| Database | PostgreSQL 15 managed by Supabase |
| Edge Functions Runtime | Deno (managed by Supabase) |
| Blockchain Network | Ethereum Sepolia Testnet |
| Smart Contract Compiler | Solidity ^0.8.19 via Hardhat |
| Wallet Infrastructure | Privy embedded wallet SDK |

### Key Software Dependencies

| Package | Version | Purpose |
|---|---|---|
| react | 18.2 | Frontend UI framework |
| typescript | 5.x | Type-safe JavaScript |
| @supabase/supabase-js | 2.x | Database and auth client |
| @privy-io/react-auth | 1.x | Embedded wallet SDK |
| react-router-dom | 6.x | Client-side routing |
| jsqr | latest | QR code decoding fallback |
| ethers | 6.x | Ethereum contract interaction |
| tailwindcss | 3.x | Utility CSS framework |

---

## 4.14 Summary

This chapter presented the complete analysis and design for EcoLedger. OOADM was selected and justified as the appropriate methodology. Functional requirements were specified across four user roles and non-functional requirements defined across nine quality dimensions. The three-layer architecture — React frontend, Supabase backend, Ethereum persistence — was described with supporting UML diagrams including Use Case, Activity, Sequence, and Class diagrams. The Data Dictionary documented all five database tables with full column definitions, data types, and constraints. Smart contract design and hardware/software specifications complete the design record from which the implementation in Chapter 5 was produced.

---

## References

Booch, G., Rumbaugh, J., & Jacobson, I. (2005). *The unified modeling language user guide* (2nd ed.). Addison-Wesley.

Ethereum Foundation. (2023). *Solidity documentation v0.8.x*. Retrieved from https://docs.soliditylang.org

Fowler, M. (2003). *UML distilled: A brief guide to the standard object modeling language* (3rd ed.). Addison-Wesley.

Supabase. (2023). *Row level security*. Retrieved from https://supabase.com/docs/guides/auth/row-level-security

Tapscott, D., & Tapscott, A. (2016). *Blockchain revolution*. Portfolio/Penguin.
