# CHAPTER 1: GENERAL INTRODUCTION

---

## 1.1 Background

The world generated approximately 53.6 million metric tonnes of electronic waste (e-waste) in 2019, a figure that rises at 3–5% annually (Forti et al., 2020). E-waste encompasses discarded electrical and electronic equipment — mobile phones, computers, televisions, tablets, and other consumer electronics that have reached the end of their useful life. While developed nations have established regulatory frameworks and formal recycling infrastructure, developing countries in Sub-Saharan Africa face far more severe consequences, receiving large volumes of used electronics imported as second-hand goods with no formal end-of-life management system in place (Baldé et al., 2017).

Liberia presents a particularly challenging context. Having endured two civil wars (1989–2003) and the Ebola epidemic (2014–2016), the country's institutional infrastructure — including environmental regulation, waste management systems, and public health services — remains severely underdeveloped (World Bank, 2021). Despite this, mobile phone and computer usage has grown steadily through expanding networks and international development programs supplying devices to schools, hospitals, and government offices. The result is a rapidly growing volume of e-waste with no formal system to track, manage, or regulate its disposal. Devices are discarded in open dumpsites, burned in informal settings, or stripped for metals by unregistered operators, releasing toxic materials including lead, mercury, and cadmium into soil and water (Robinson, 2009).

This project responds by designing and implementing EcoLedger — a Blockchain-Enabled E-Waste Tracking and Accountability Platform for Liberia. EcoLedger creates a digital lifecycle record for every registered device, anchors critical events permanently on the Ethereum blockchain, and rewards responsible disposal through a digital incentive mechanism called EcoCredits.

---

## 1.2 Problem Statement

The following specific problems underpin the need for this project:

- **No Device Lifecycle Visibility:** No institution in Liberia maintains records of what happens to electronic devices after purchase. The true volume of e-waste generated cannot be quantified.
- **No Recycler Accountability:** Informal recyclers operate without registration, certification, or environmental monitoring. Their activities are invisible to the regulatory system.
- **No Consumer Incentive:** Without any reward for responsible disposal, informal dumping remains the path of least resistance for device owners.
- **Data Integrity Risk:** Any paper-based or centralized digital system in a weak institutional environment is vulnerable to manipulation, falsification, and loss.
- **Regulatory Blind Spots:** Environmental inspectors lack real-time data on device movements and recycler performance, making proactive enforcement impossible.

---

## 1.3 Motivation

EcoLedger's motivation is grounded in both the urgency of Liberia's environmental challenge and the demonstrated capacity of blockchain technology to address accountability problems in multi-stakeholder environments. The Environmental Protection Agency of Liberia (EPA) has limited capacity to enforce e-waste regulations without reliable data on where devices are and what is being done with them. By creating a digital backbone for e-waste data, EcoLedger gives regulators the visibility needed to move from reactive to proactive environmental governance.

The EcoCredits mechanism addresses a second dimension: behavioral change in waste management requires systems that make responsible choices more rewarding than irresponsible ones. Furthermore, Liberia shares its e-waste governance challenges with neighboring West African countries, making EcoLedger a replicable regional model.

---

## 1.4 Aims and Objectives

### 1.4.1 Aim

To design and implement a blockchain-enabled digital platform that tracks the complete lifecycle of electronic waste in Liberia, promotes accountability among all stakeholders, and incentivizes responsible disposal through a digital rewards mechanism.

### 1.4.2 Objectives

1. To analyze the existing e-waste management landscape in Liberia and identify key stakeholders, roles, and information flows.
2. To design a role-based information system supporting consumers, recyclers, inspectors, and administrators in a coordinated e-waste lifecycle tracking process.
3. To implement a blockchain integration layer using Ethereum smart contracts that anchors device lifecycle events on an immutable public ledger.
4. To develop a mobile-optimized QR code scanning interface enabling field operatives to identify and update device records in real time.
5. To design and implement an EcoCredits incentive mechanism rewarding consumers for registering devices and submitting them for certified recycling.
6. To deploy and test the platform in a live environment and evaluate performance against functional and non-functional requirements.

---

## 1.5 Challenges

- **Blockchain Integration Complexity:** Managing wallet creation, transaction signing, and gas fees for non-technical users required the Privy embedded wallet SDK to abstract all blockchain complexity.
- **Low Technical Literacy:** The user interface had to serve consumers, recyclers, and inspectors with varying levels of digital experience without sacrificing technical rigor.
- **Role-Based Access Control:** Designing secure, flexible access control for four distinct roles using Supabase Row Level Security required precise architectural decisions.
- **Data Consistency:** Synchronizing data between Supabase and the Ethereum blockchain required careful event handling to prevent lost or duplicated records.
- **Network Reliability:** Blockchain writes are managed asynchronously to avoid blocking user workflows when internet connectivity is intermittent.

---

## 1.6 Essence of Approach

EcoLedger was built on a layered architecture separating three concerns: the user interface layer (React and TypeScript), the application data layer (Supabase PostgreSQL with Row Level Security), and the blockchain persistence layer (Solidity smart contracts on Ethereum Sepolia testnet). Privy embedded wallets handle blockchain identity for users without requiring any cryptocurrency knowledge. QR codes generated for each device enable rapid field identification via the mobile scanning interface. Development followed the Object-Oriented Analysis and Design Methodology (OOADM).

---

## 1.7 Scope and Delimitation

**In scope:**
- Registration of electronic devices with key identifiers (serial number, IMEI for smartphones and tablets, brand, model, category)
- Tracking of lifecycle events: registration, submission, recycler intake, processing, and certified completion
- Blockchain anchoring of events on Ethereum Sepolia testnet
- Role-based dashboards for all four user roles
- Mobile QR code scanning interface
- EcoCredits incentive system
- Email-based invitation and onboarding for institutional users

**Out of scope:**
- Physical e-waste collection logistics
- IoT or RFID automated device detection
- Ethereum mainnet deployment
- Legal enforcement mechanisms
- Countries other than Liberia as primary case study

---

## 1.8 Statement of Assumptions

1. Users have access to a smartphone or computer with internet connectivity.
2. Institutional users will receive onboarding training before using the platform.
3. The EPA-Liberia or a delegated authority will manage administrator accounts and oversee recycler and inspector registration.
4. The Ethereum Sepolia testnet will remain accessible during the evaluation period.
5. Consumers are willing to register devices given the EcoCredits incentive.
6. QR code labels attached to registered devices will remain legible throughout the device lifecycle.

---

## 1.9 Expected Results

1. A fully functional deployed web application supporting all four user roles with their respective dashboards and workflows.
2. A working blockchain integration anchoring device lifecycle events on Ethereum Sepolia.
3. A mobile QR code scanning interface capable of identifying registered devices in the field.
4. A functional EcoCredits system rewarding consumers upon device registration.
5. Testing results confirming all core functional requirements are met.
6. A replicable platform architecture adaptable for other West African countries.

---

## 1.10 Organization of the Report

| Chapter | Content |
|---|---|
| Chapter 1 | General Introduction — background, problem statement, objectives, scope |
| Chapter 2 | Literature Review — e-waste research, blockchain, existing systems, research gap |
| Chapter 3 | Analysis of Existing System — Liberia context, stakeholder roles, feasibility study |
| Chapter 4 | Analysis and Design — OOADM methodology, UML diagrams, database and architecture design |
| Chapter 5 | Implementation — UI screenshots, system testing results |
| Chapter 6 | Conclusion and Recommendations |

---

## References

Baldé, C. P., Forti, V., Gray, V., Kuehr, R., & Stegmann, P. (2017). *The global e-waste monitor 2017*. United Nations University.

Forti, V., Baldé, C. P., Kuehr, R., & Bel, G. (2020). *The global e-waste monitor 2020*. United Nations University.

Kshetri, N. (2018). Blockchain's roles in meeting key supply chain management objectives. *International Journal of Information Management*, 39, 80–89.

Robinson, B. H. (2009). E-waste: An assessment of global production and environmental impacts. *Science of the Total Environment*, 408(2), 183–191.

World Bank. (2021). *Liberia overview*. The World Bank Group. Retrieved from https://www.worldbank.org/en/country/liberia/overview
