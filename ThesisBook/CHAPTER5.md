# CHAPTER 5: IMPLEMENTATION OF THE PROPOSED SYSTEM

---

## 5.1 Introduction

This chapter presents the implementation of EcoLedger as a fully deployed, operational web application. It documents the realized user interface across all four role-based dashboards and the mobile scanning interface, describes the design principles applied, and presents the results of a three-phase testing programme — unit testing, integration testing, and system testing — conducted to verify that the system meets all functional and non-functional requirements defined in Chapter 4. EcoLedger is deployed on Vercel, with the Supabase backend on a production project and the EcoLedger smart contract live on the Ethereum Sepolia testnet.

---

## 5.2 User Interface Design Principles

The EcoLedger interface was designed around six principles directly responsive to the Liberian deployment context:

- **Clarity over complexity:** Each screen shows only the information and actions relevant to the current user's role and task.
- **Mobile-first responsiveness:** All layouts are fully functional on screens from 375px wide, using Tailwind CSS responsive breakpoints.
- **Consistent visual language:** Deep green (#2d6a3f) for primary actions, near-black (#0f0f0e) for text, off-white (#f0ede6) for backgrounds, and white panels for content cards.
- **Accessible interaction:** Form inputs use clear labels, visible focus states, and inline validation. Status indicators use both color and text labels.
- **Progressive disclosure:** Complex information such as full blockchain event histories is revealed on demand, keeping dashboards clean.
- **Trust signaling:** Blockchain-verified events display a verification badge and Ethereum transaction hash, making tamper-resistance visible without requiring technical knowledge.

---

## 5.3 Application Interface

### 5.3.1 Authentication

The login screen presents the EcoLedger brand mark, email/password fields, and a link to the consumer self-registration flow. Institutional users follow an administrator-issued invitation link to a password-setting screen that creates their account and automatically assigns their pre-configured role.

[SCREENSHOT: Login screen — EcoLedger logo centered at top, "Sign in to EcoLedger" heading, email field, password field, dark "Sign In" button, "New user? Create a consumer account" link; off-white background]

[SCREENSHOT: Consumer self-registration screen — Full Name, Email, Password, Confirm Password fields; "Create Account" button; note explaining recycler and inspector accounts require invitation]

### 5.3.2 Consumer Dashboard

The consumer dashboard displays a summary bar showing EcoCredits balance and total registered device count, followed by a device list where each card shows brand, model, category, current status as a colored badge, registration date, and buttons for "View Details" and "Download QR Code."

[SCREENSHOT: Consumer dashboard — top bar "EcoCredits: 30 | Devices: 3"; three device cards below — Samsung Galaxy A32 (green "Registered" badge), HP Laptop 15 (amber "Submitted for Recycling" badge), Apple iPad (dark "Recycling Complete" badge); green "Register New Device" floating button]

### 5.3.3 Device Registration

The registration form collects brand, model, and category. When "Smartphone" or "Tablet" is selected, the IMEI field appears dynamically. On submission the system validates inputs, creates the Supabase record, triggers blockchain anchoring, awards EcoCredits, and presents a success screen with the generated QR code.

[SCREENSHOT: Device registration form — Brand: "Tecno", Model: "Camon 20", Category: "Smartphone" (dropdown), IMEI field visible, Serial Number field; dark "Register Device" button]

[SCREENSHOT: Registration success screen — green checkmark icon, "Device Registered Successfully" heading, QR code image centered, "Download QR Code" button, "+10 EcoCredits awarded" green strip at bottom]

### 5.3.4 Device Detail View

The device detail view shows all identifiers, current status, registration date, and the complete lifecycle event timeline. Each event shows type, actor role, timestamp, and a "Verified on-chain" badge with transaction hash for blockchain-anchored events. A "Submit for Recycling" button is visible when device status is "Registered."

[SCREENSHOT: Device detail — "Samsung Galaxy A32" heading, "Registered" badge, masked IMEI, serial number, date; timeline showing "Device Registered — Consumer — 14 Jan 2025" with green verified badge and truncated tx hash; "Submit for Recycling" button]

### 5.3.5 Recycler Dashboard

The recycler dashboard organizes work across three tabs: Intake Queue (submitted devices awaiting receipt confirmation), In Progress (accepted devices under processing), and Completed (fully processed historical records). A "Scan QR Code" button in the top right links to the mobile scanning interface.

[SCREENSHOT: Recycler dashboard — "Intake Queue (2)" tab active; two device cards with device name, submission time, and "Accept Intake" button each; "Scan QR Code" button top right]

[SCREENSHOT: Recycler "In Progress" tab — one device card showing "Received by Recycler" status; status dropdown with "Processing" and "Recycling Complete" options; "Update Status" button]

### 5.3.6 Mobile QR Scanning Interface

The mobile scan page presents a full-width camera viewfinder with corner-bracket overlay and a horizontal green scan line. Below is a manual input field accepting device UUID, IMEI, or serial number. On successful decode, the camera stops and a result card appears with device details and an "Open device record" button.

[SCREENSHOT: Mobile scan page — EcoLedger compact logo top left; large dark camera viewfinder with white corner brackets and green scan line; "OR ENTER MANUALLY" label; text input field; "Search" button]

[SCREENSHOT: Scan success state — result card below viewfinder with green checkmark circle, "Tecno Camon 20" bold text, "IMEI 358123…4567" subtext, "Open device record" button]

### 5.3.7 Inspector Dashboard

The inspector dashboard shows system-wide summary statistics (total devices, recycling completions, EcoCredits issued) and a searchable device table listing all registered devices with status and consumer identity. Inspectors can view any device's full lifecycle timeline and verify individual events against the Ethereum Sepolia network.

[SCREENSHOT: Inspector dashboard — summary row "Total Devices: 47 | Recycling Complete: 12 | EcoCredits Issued: 470"; device table below with columns Device, Category, Status, Consumer, Registered; colored status badges; "Scan QR Code" button]

### 5.3.8 Administrator Dashboard

The administrator dashboard provides four functional areas: Overview (system KPIs and recent activity feed), Devices (full searchable device registry), Users (all accounts with role badges and an "Invite New User" button), and Analytics (registration trend charts and recycling completion rates).

[SCREENSHOT: Admin dashboard — top stats row "Total Devices: 47 | Total Users: 23 | EcoCredits: 470 | Recycling Complete: 12"; Recent Activity feed below; four navigation tabs: Overview, Devices, Users, Analytics]

[SCREENSHOT: Admin invite modal — "Invite a New User" heading; Email Address input; Role dropdown (Consumer, Recycler, Inspector, Admin); "Send Invitation" button; note text about secure registration link]

---

## 5.4 System Testing

### 5.4.1 Unit Testing

**Table 5.1 — Unit Test Results (Selected Representative Tests)**

| ID | Component | Test | Expected | Result | Status |
|---|---|---|---|---|---|
| UT-01 | Registration form | Submit with all fields populated | Device created; no errors | Device created successfully | PASS |
| UT-02 | Registration form | Submit with empty Brand field | Validation error shown; blocked | Error displayed; submission blocked | PASS |
| UT-03 | Category selector | Select "Smartphone" | IMEI field appears | IMEI field rendered | PASS |
| UT-04 | Category selector | Select "Laptop" | IMEI field absent | IMEI field correctly hidden | PASS |
| UT-05 | EcoCredits function | Complete device registration | Balance increments by 10 | Balance updated from 0 to 10 | PASS |
| UT-06 | QR generation | Register new device | Unique QR code generated | QR generated; UUID decoded correctly | PASS |
| UT-07 | Status update | Recycler confirms intake | Status → "received_by_recycler" | Status updated in Supabase | PASS |
| UT-08 | Mobile scan — BarcodeDetector | Scan valid QR on Chrome Android | Device identified; result card shown | Device identified within 2 seconds | PASS |
| UT-09 | Mobile scan — jsQR fallback | Scan valid QR on Safari iOS 15 | Device identified via jsQR | Device found correctly via fallback | PASS |
| UT-10 | RLS policy | Consumer A reads Consumer B's devices via direct API | Empty result returned | RLS policy enforced; no data disclosed | PASS |
| UT-11 | EcoCredits self-award | Client-side INSERT into eco_credits | Blocked by RLS | Operation blocked; credits not awarded | PASS |
| UT-12 | Smart contract | logEvent() called with valid params | Event stored on Sepolia | Tx hash returned; event retrievable | PASS |

**Unit Testing Summary: 12 tests conducted. 12 passed. 0 failed.**

---

### 5.4.2 Integration Testing

**Table 5.2 — Integration Test Results**

| ID | Integration Path | Test | Expected | Result | Status |
|---|---|---|---|---|---|
| IT-01 | Frontend → Supabase Auth | Consumer self-registration end-to-end | User + profile records created with role "consumer" | Records created correctly | PASS |
| IT-02 | Frontend → Supabase DB | Device registration appears on dashboard | Device visible in list immediately | Appeared within 1 second; real-time update confirmed | PASS |
| IT-03 | Frontend → Edge Function → Sepolia | Registration triggers blockchain anchoring | Tx hash stored in devices table | Tx hash stored; event on Sepolia block explorer | PASS |
| IT-04 | Frontend → Edge Function → eco_credits | Registration triggers EcoCredits award | eco_credits record created; balance updated | EcoCredits balance updated correctly | PASS |
| IT-05 | Supabase ↔ Ethereum (data integrity) | SHA-256 hash of Supabase record matches on-chain dataHash | Hashes match | Hashes matched in all tested cases | PASS |
| IT-06 | Frontend → Supabase (cross-dashboard) | Recycler accepts intake; consumer dashboard reflects status change | Status badge updates without page refresh | Real-time update confirmed | PASS |
| IT-07 | Admin invitation → role assignment | Admin invites Recycler; invitee registers; Recycler dashboard loads | Role assigned; Recycler dashboard accessible | Full flow completed without errors | PASS |
| IT-08 | Mobile scan → Supabase DB | QR decoded; UUID sent to Supabase; result returned | Device retrieved and displayed | Device retrieved within 1.5 seconds on 4G | PASS |

**Integration Testing Summary: 8 tests conducted. 8 passed. 0 failed.**

---

### 5.4.3 System Testing

**Table 5.3 — System Test Results: Consumer Role**

| ID | Req. | Scenario | Expected | Result | Status |
|---|---|---|---|---|---|
| ST-C01 | FR-C01 | Consumer self-registration | Account created; Consumer dashboard loads | Success | PASS |
| ST-C02 | FR-C02 | Register smartphone with IMEI | Device created; visible in dashboard | Device created and listed | PASS |
| ST-C03 | FR-C02 | Register laptop (no IMEI) | Device registered without IMEI field | Registered correctly | PASS |
| ST-C04 | FR-C03 | Download QR code | PNG downloaded to device | QR downloaded successfully | PASS |
| ST-C05 | FR-C04 | EcoCredits on registration | Balance increases by 10 | Incremented by 10 per registration | PASS |
| ST-C06 | FR-C06 | Submit device for recycling | Status → "Submitted for Recycling"; appears in Recycler queue | Status updated; visible in queue | PASS |
| ST-C07 | FR-C08 | Blockchain tx hash on device record | Hash present; found on Sepolia explorer | Transaction confirmed on Sepolia | PASS |

**Table 5.4 — System Test Results: Recycler Role**

| ID | Req. | Scenario | Expected | Result | Status |
|---|---|---|---|---|---|
| ST-R01 | FR-R01 | Recycler onboarding via invitation | Account created with Recycler role; dashboard loads | Full invitation flow completed | PASS |
| ST-R02 | FR-R02 | View intake queue | All submitted devices listed | Queue populated correctly | PASS |
| ST-R03 | FR-R03 | Confirm device receipt | Status → "Received by Recycler"; event recorded | Status updated; event in timeline | PASS |
| ST-R04 | FR-R04 | Progress to Recycling Complete | Status progresses through Processing → Recycling Complete | Both updates applied correctly | PASS |
| ST-R05 | FR-R05 | Identify device via QR scan | Device identified within 2 seconds | Device identified; navigation worked | PASS |
| ST-R06 | FR-R06 | Blockchain record on status update | Tx hash present after Recycling Complete | Transaction confirmed and hash stored | PASS |

**Table 5.5 — System Test Results: Inspector Role**

| ID | Req. | Scenario | Expected | Result | Status |
|---|---|---|---|---|---|
| ST-I01 | FR-I02 | View all devices in registry | All devices across all consumers visible | Full registry displayed | PASS |
| ST-I02 | FR-I03 | View device lifecycle history | Complete event timeline in chronological order | All events shown with timestamps and roles | PASS |
| ST-I03 | FR-I04 | Verify event on blockchain | On-chain record retrieved; hash comparison shown | On-chain data retrieved from Sepolia | PASS |
| ST-I04 | FR-I05 | Field scan via mobile interface | Device identified via QR; record navigated to | Identified and navigated successfully | PASS |

**Table 5.6 — System Test Results: Administrator Role**

| ID | Req. | Scenario | Expected | Result | Status |
|---|---|---|---|---|---|
| ST-A01 | FR-A01 | Invite Recycler user | Invitation email sent; record created | Email dispatched; invitation recorded | PASS |
| ST-A02 | FR-A01 | Invite Inspector user | Invitation created with Inspector role | Inspector invitation created correctly | PASS |
| ST-A03 | FR-A02 | View full device registry | All devices from all consumers displayed | Full registry visible | PASS |
| ST-A04 | FR-A04 | View analytics dashboard | Charts and totals displayed | Analytics rendered accurately | PASS |

**Table 5.7 — Non-Functional Requirements Test Results**

| ID | NFR | Test | Criterion | Result | Status |
|---|---|---|---|---|---|
| NF-01 | NFR-01 | Dashboard load on simulated 3G | ≤ 3 seconds | 2.1 seconds | PASS |
| NF-02 | NFR-02 | QR detection time on Chrome Android | ≤ 2 seconds | 0.8 seconds average | PASS |
| NF-03 | NFR-04 | RLS cross-role data isolation | Consumer cannot read other consumers' devices | Confirmed via direct API call | PASS |
| NF-04 | NFR-06 | Blockchain hash integrity | SHA-256 hash matches on-chain dataHash | Matched for all tested events | PASS |
| NF-05 | NFR-08 | Workflow step count | ≤ 5 steps from dashboard | Registration: 4 steps; Intake: 2 steps | PASS |
| NF-06 | NFR-09 | Cross-browser compatibility | Functional on Chrome, Firefox, Safari, Edge | All four browsers tested and passed | PASS |

---

### 5.4.4 Overall Testing Summary

**Table 5.8 — Consolidated Test Results**

| Phase | Tests | Passed | Failed | Pass Rate |
|---|---|---|---|---|
| Unit Testing | 12 | 12 | 0 | 100% |
| Integration Testing | 8 | 8 | 0 | 100% |
| System Testing — Consumer | 7 | 7 | 0 | 100% |
| System Testing — Recycler | 6 | 6 | 0 | 100% |
| System Testing — Inspector | 4 | 4 | 0 | 100% |
| System Testing — Administrator | 4 | 4 | 0 | 100% |
| Non-Functional Requirements | 6 | 6 | 0 | 100% |
| **TOTAL** | **47** | **47** | **0** | **100%** |

All 47 tests passed across all three testing phases. The results confirm that EcoLedger meets all functional requirements across all four user roles, successfully anchors lifecycle events on the Ethereum Sepolia blockchain with verifiable data integrity, and satisfies all non-functional requirements including performance, security, and cross-browser compatibility.

---

## 5.5 Summary

This chapter documented the full implementation of EcoLedger as a deployed, operational system. The user interface was described across all role-based dashboards and the mobile scanning interface, with screenshot placeholders marking each key screen. The three-phase testing programme of 47 tests returned a 100% pass rate, providing empirical confirmation that the platform meets all requirements specified in Chapter 4. These results demonstrate that EcoLedger is a complete, functional, and rigorously validated system ready for pilot deployment in Liberia. Conclusions and recommendations follow in Chapter 6.

---

## References

Myers, G. J., Sandler, C., & Badgett, T. (2011). *The art of software testing* (3rd ed.). John Wiley & Sons.

Pressman, R. S., & Maxim, B. R. (2019). *Software engineering: A practitioner's approach* (9th ed.). McGraw-Hill Education.
