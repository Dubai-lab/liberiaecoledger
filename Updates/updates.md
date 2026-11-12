# EcoLedger — SIRR-WHO Branch Updates

Summary of everything delivered on the `SIRR-WHO` branch, for review before merging into `main`.

| Commit | Title |
| --- | --- |
| `7536eb0` | SIRR-WHO (access check) |
| `5e3247f` | Request-access form submits to the admin dashboard |
| `d556bc7` | Consumer email/password sign-up with email code |
| `2d6687c` | SIRR-WHO-COMMIT (UI redesign, device registry, rates, public ledger) |
| `948cc9a` | SIRR-WHO REVISED (one email per identity, invite emails, clean-ups) |

---

## 1. Access & accounts

### Stakeholder access requests
- **Request access** (`/stakeholders/request-access`) is a real form: name, email, phone, job title, organisation, role, message.
- Submissions are saved to the database and listed in **Admin → Invitations → Access Requests** (Pending / Approved / Rejected). Admins are alerted by email and in-app notification.
- **Approve** creates an invitation and emails the access code. The invitee then signs in through **Government SSO** with that code, sets a password and lands on their dashboard. **Reject** marks the request rejected.
- This form is for **manufacturers, recyclers, regulators and NGOs only**. Consumers are directed to create an account instead.

### Consumer sign-up
- **Desktop:** `/signup`, linked from the **Create a consumer account** button on the Sign in page.
- **Mobile:** the Sign in / Sign up tabs on `/mobile/login`.
- **Fields:** first name, surname, email, password and confirm password (with show/hide and a strength checklist).
- After submitting, the user receives a **verification code by email**. Entering it activates the account, and the same email and password work from then on.

### One email = one identity
- An email can be used **once**: for one account, one open access request or one pending invitation.
- If a person needs more than one role, an **admin adds the extra role to their existing account** in **Admin → Users**. They don't submit a second request or create a second account.

### Invitation emails
- Invite emails now send correctly. If a send ever fails, the admin sees the real reason, and every pending invitation has a **Resend email** button.

---

## 2. Device registry (manufacturer-sourced)

- **Manufacturers are the only source of devices** on the ledger:
  - **Smartphones:** need a **unique, valid 15-digit IMEI** (check-digit verified).
  - **Laptops:** need a **serial number**; IMEI is optional and laptops are not forced to be unique.
- Each manufacturer registration automatically writes a **"manufactured"** event to the ledger.
- **Consumers register a device by verifying it:** they enter the phone's IMEI or the laptop's serial number. The system confirms it is a genuine manufacturer-registered device that no one else owns, then transfers it to the consumer and awards EcoCredits.
- Consumers **cannot** add devices that aren't in the manufacturer registry. This is enforced by the database, not just the screens.

---

## 3. Rates & prices (Admin → Rates & Prices)

- Admins set:
  - **EcoCredits per registration** (currently **10 EC**) and **per transfer** (currently **5 EC**)
  - **Market price per gram** of gold, copper, aluminium, lithium, cobalt and lead
  - **EcoCredit value** in LRD (currently **LRD 150 per EC**)
- Recycling rewards are calculated from recovered materials × current price ÷ EcoCredit value, so payouts follow market prices.
- Every change is recorded in a **change history**.
- The public pages (landing page, Consumers page, Whitepaper) show these **live values**, so they always match what the platform actually pays.

---

## 4. Public ledger

- The **Block Explorer** page has a live **Public Ledger** feed of every action: manufactured, registered, transferred, recycled, flagged. Anyone can view it without logging in.
- **Privacy:** organisations are named; private owners are never identified; IMEIs and serial numbers are partly hidden.
- The landing page links to it with **View ledger** and **Explorer** buttons in the "Trust by design" section.

---

## 5. Design (UI/UX update)

- The whole platform follows `Design/design.md`: forest-green palette, **Poppins** headings and **Inter** body text, a 1200px content width and consistent spacing.
- **Covered:** the landing page, all footer pages (Platform, Stakeholders, Resources, Legal), the sign-in and sign-up pages, every dashboard and the mobile app.
- **New shared logo:** recycle icon + "EcoLedger" wordmark.
- **Landing header:** highlights the section you're reading, with a progress bar. On mobile, a scrollable strip of section tabs appears.
- **Landing page:** no longer shows any code or technical names.
- **Dashboard sidebar:** white text and icons that soften on hover; no visible scrollbar.

---

## 6. Supabase status

| Item | Status |
| --- | --- |
| Migrations `20261112_access_requests`, `20261112_consumer_signup_profile_name`, `20261113_manufacturer_imei_registry_and_rates`, `20261114_one_email_one_identity` | **Applied** |
| `notify` function (invite emails, access-request alerts) | **Deployed and tested** |
| Rates table seeded (10 EC / 5 EC / LRD 150 + material prices) | **Done** |
| **Confirm signup** email template with the verification code | **To do:** paste `supabase/templates/confirm-signup.html` into Supabase → Authentication → Email Templates → Confirm signup |

`scripts/supabase-setup.mjs` re-applies and checks the Supabase setup if needed. It needs a Supabase access token in the `SUPABASE_ACCESS_TOKEN` environment variable.

---

## 7. How to test after merging

1. **Consumer sign-up:** Sign in → **Create a consumer account** → enter details → enter the emailed code → you land on the consumer dashboard. *(Needs the template step above.)*
2. **Stakeholder access:** **Get access** → submit the form → as admin, **Approve** it in Invitations → the invitee receives the code → Government SSO → set a password.
3. **One email rule:** try requesting access or signing up again with an email that's already used. You should get a clear refusal.
4. **Device registry:** as a manufacturer, register a Smartphone (IMEI) and a Laptop (serial). As a consumer, **Register a Device** using that IMEI or serial → verified → registered, with 10 EC earned.
5. **Rates:** as admin, change a rate in **Rates & Prices** → the landing page and new transactions use the new value.
6. **Public ledger:** landing page → **View ledger** → the new events appear.
