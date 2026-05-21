# CHAPTER 3: ANALYSIS OF THE EXISTING SYSTEM

---

## 3.1 Introduction

This chapter presents a systematic analysis of the existing e-waste management landscape in Liberia. It begins with an overview of the operating environment, including the relevant institutions and regulatory bodies. It then maps the roles and responsibilities of current stakeholders, documents the fact-finding methodology employed, and conducts a structured problem analysis. The chapter concludes with a feasibility study evaluating the proposed solution across three dimensions: technical, economic, and organizational.

---

## 3.2 Overview of the Operating Environment

### 3.2.1 Country Profile: Liberia

Liberia is a West African nation with a population of approximately 5.3 million and a capital in Monrovia (World Bank, 2022). Two civil wars (1989–2003) and the Ebola epidemic (2014–2016) severely damaged the country's institutional infrastructure. Despite this, mobile telephone penetration has grown significantly, with over 3.4 million mobile subscriptions recorded by 2020 (LTA, 2020). International development organizations have supplied computers, tablets, and communication devices to schools, hospitals, and government ministries. These device inflows contribute to a growing volume of e-waste for which no formal end-of-life management system exists.

### 3.2.2 Environmental Protection Agency of Liberia

The Environmental Protection Agency of Liberia (EPA), established under the EPA Act of 2002, is the primary governmental body responsible for environmental oversight. In the e-waste domain, the EPA is the notional regulatory authority but has no dedicated e-waste unit, no formal device registry, and no standardized procedure for monitoring or certifying recycling operations. Enforcement is entirely reactive, responding to environmental incidents after they occur rather than preventing them through proactive oversight. The absence of any interoperable information system across environmental institutions means even basic e-waste volume estimates cannot be produced.

### 3.2.3 The Informal E-Waste Ecosystem

The Liberian e-waste ecosystem operates informally across three layers. Electronic devices enter the country through retail, institutional procurement, and second-hand imports through the port of Monrovia. At end-of-life, devices pass through informal trading networks where vendors attempt repair and resale. Devices beyond repair are sold by weight to scrap dealers who strip them for copper, aluminum, and iron — often using open burning to remove insulation from wiring, releasing toxic gases. Residual materials including batteries and circuit boards are dumped in open sites on the urban periphery. No formally licensed recycling operator for electronic waste exists in Liberia.

[DIAGRAM: Flowchart of the current informal e-waste lifecycle in Liberia — Device Purchase/Import → Consumer Use → End-of-Life → Informal Trading → Informal Processing/Open Dumping — with annotations showing absence of formal tracking at each stage]

---

## 3.3 Roles and Assignments

The existing system involves four categories of actor, each performing uncoordinated functions with no shared information system.

| Stakeholder | Current Role | Key Gap |
|---|---|---|
| Consumers | Informally dispose of or sell end-of-life devices | No formal registration or certified disposal channel |
| Informal Recyclers | Collect, disassemble, and process devices for scrap metal | No certification, monitoring, or environmental accountability |
| Environmental Inspectors | Reactive environmental monitoring; no e-waste-specific oversight | No real-time data; no proactive enforcement tools |
| Administrative Authorities | Policy oversight; no systematic e-waste data collection | Cannot formulate evidence-based policy without lifecycle data |

[DIAGRAM: Organizational chart showing four stakeholder categories with arrows indicating current informal and undocumented information flows between them, and annotations highlighting the absence of formal tracking at each node]

---

## 3.4 Fact-Finding Methodology

Five complementary fact-finding techniques were used to analyze the existing system:

**Interview Technique:** Structured interviews with e-waste researchers, development practitioners, and technology professionals familiar with the West African context surfaced behavioral dynamics of informal recyclers, limitations of regulatory enforcement, and digital access patterns among Liberian users.

**Questionnaire Technique:** A structured questionnaire gathered data on device ownership patterns, end-of-life disposal practices, and willingness to use a formal digital recycling platform given appropriate incentives. Results informed EcoCredits design and the mobile-first UI orientation.

**Observation Technique:** Published field reports from Greenpeace, the Basel Action Network, and comparable African e-waste contexts provided observational evidence of informal recycling processes, environmental conditions, and human factors the platform must accommodate.

**Document Analysis Technique:** Analysis of the EPA-Liberia Act, Global E-Waste Monitor reports, World Bank development assessments, and LTA annual reports established the regulatory framework, data gaps, and statistical context for the e-waste challenge.

**Prototyping Technique:** Early wireframes and functional prototypes of the consumer registration interface, recycler dashboard, and mobile scanning interface were evaluated before full implementation, enabling iterative refinement of usability decisions and early validation of the technical architecture.

---

## 3.5 Problem Analysis

### 3.5.1 Business Requirements

Based on the stakeholder analysis and fact-finding, the following core business requirements were defined:

| ID | Requirement |
|---|---|
| BR-01 | Register electronic devices with unique identifiers and generate QR codes for physical attachment |
| BR-02 | Record each lifecycle event with timestamp and responsible actor |
| BR-03 | Enforce role-based access so each user type accesses only authorized data and functions |
| BR-04 | Anchor critical events on a tamper-resistant blockchain to prevent falsification |
| BR-05 | Award EcoCredits to consumers for registration and certified recycling submission |
| BR-06 | Support QR code scanning on mobile devices for field use without app installation |
| BR-07 | Provide inspectors and administrators with real-time system-wide visibility |

### 3.5.2 Tangible and Intangible Value

**Tangible:** Quantifiable e-waste volumes for EPA planning; auditable recycling records; a verifiable certification pathway for recyclers; direct EcoCredits value for consumers.

**Intangible:** Increased public awareness of e-waste consequences; institutional trust built through tamper-resistant records; behavioral change in consumer disposal habits; reputational positioning for Liberia as a regional leader in environmental digital governance.

---

## 3.6 Proposed Solution and Feasibility Study

### 3.6.1 Technical Feasibility

EcoLedger is built on mature, widely adopted technologies: React and TypeScript for the frontend, Supabase (PostgreSQL) for the backend, Solidity smart contracts on Ethereum Sepolia for blockchain persistence, and Privy for embedded wallet management. All technologies were selected based on proven production use, extensive documentation, and the development team's validated hands-on competency across every component. The mobile QR scanning interface uses the native BarcodeDetector API with jsQR fallback, ensuring compatibility across all major mobile browsers including older iOS Safari. No speculative or unproven technology is present in the stack.

**Conclusion: Technically feasible.** All required components are mature and within proven development team competency.

[DIAGRAM: Technical architecture showing three layers — React/TypeScript frontend (Vercel) → Supabase backend (PostgreSQL + RLS + Edge Functions) → Ethereum Sepolia smart contracts — with Privy SDK bridging frontend to blockchain, and arrows showing data flows]

### 3.6.2 Economic Feasibility

EcoLedger was developed using exclusively open-source and free-tier services. At production scale, projected operational costs are modest: Supabase Pro (~USD 25/month), Vercel Pro (~USD 20/month), and Ethereum Layer 2 gas fees (negligible per transaction at scale). These costs are well within the budget of EPA-Liberia or any international development partner. The cost of inaction — continued environmental degradation, public health consequences, and policy made without reliable data — substantially exceeds the platform's modest operational investment.

**Conclusion: Economically feasible.** Low operational cost relative to the scale of the environmental problem addressed.

### 3.6.3 Organizational Feasibility

EcoLedger aligns directly with EPA-Liberia's mandate. Its role-based design mirrors existing institutional structures: the EPA acts through the Administrator role, recyclers and inspectors are onboarded through a controlled invitation workflow, and consumers self-register through a straightforward interface. The EcoCredits incentive addresses consumer adoption barriers, and the certification pathway provides a positive incentive for recycler formalization. Moderate onboarding training is sufficient for institutional users; the consumer interface requires no prior digital experience with blockchain concepts.

**Conclusion: Organizationally feasible.** Role design aligns with institutional structures; incentive architecture is designed to motivate adoption at both ends of the e-waste chain.

---

## 3.7 Summary

This chapter established that Liberia has no formal system for electronic device lifecycle tracking, that four key stakeholder groups operate without coordination or accountability, and that the current system creates severe environmental and governance risks. Fact-finding through five complementary techniques validated seven business requirements and confirmed both the need for the proposed solution and the specific design constraints it must satisfy. The feasibility study concluded positively on all three dimensions — technical, economic, and organizational — providing a rigorous basis for the system design presented in Chapter 4.

---

## References

Greenpeace. (2009). *Toxic tech: Not in our backyard*. Greenpeace International.

Liberia Telecommunications Authority. (2020). *Annual report 2020*. Government of Liberia.

World Bank. (2022). *Liberia: Country data*. Retrieved from https://data.worldbank.org/country/liberia
