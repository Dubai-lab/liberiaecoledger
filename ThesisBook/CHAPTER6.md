# CHAPTER 6: CONCLUSION AND RECOMMENDATIONS

---

## 6.1 Introduction

This chapter presents the conclusions drawn from the design, development, and testing of EcoLedger — the Blockchain-Enabled E-Waste Tracking and Accountability Platform for Liberia. Each conclusion corresponds directly to one of the six objectives stated in Chapter 1, demonstrating the extent to which each objective was achieved. Following the conclusions, targeted recommendations are presented for further development and deployment, each grounded in a specific finding from the project.

---

## 6.2 Conclusions

### Objective 1 — Analysis of the Existing E-Waste Landscape

The analysis conducted in Chapter 3 established that Liberia has no formal system for tracking electronic devices through their lifecycle. Four principal stakeholder categories were identified and mapped — consumers, informal recyclers, environmental inspectors, and administrative authorities — and the specific information gaps at each node were documented. The analysis confirmed that the absence of a lifecycle information system, rather than the absence of policy intent, is the primary barrier to effective e-waste governance in Liberia. This finding aligns with and extends existing literature on Sub-Saharan African e-waste governance (Osibanjo & Nnorom, 2007) with a country-specific account that no prior study had produced for Liberia.

**Objective 1 was fully achieved.**

### Objective 2 — Role-Based Information System Design

EcoLedger implements a fully realized role-based architecture providing each of the four stakeholder categories with a dedicated dashboard, tailored workflows, and precisely scoped data access. The enforcement of role boundaries through Supabase Row Level Security at the database tier — independently of application logic — ensures that access controls cannot be circumvented through client-side manipulation. This design is particularly significant in a context where institutional trust in centralized data systems is historically low; blockchain anchoring and database-level RLS together make the system trustworthy by architecture, not by assumption.

**Objective 2 was fully achieved.**

### Objective 3 — Blockchain Integration Layer

The EcoLedger Solidity smart contract deployed on Ethereum Sepolia provides a functioning immutable audit ledger. Critical lifecycle events are anchored on-chain via SHA-256 hash of the event payload, with the resulting transaction hash stored in Supabase to enable future verification. The integration of Privy embedded wallets eliminates all user-facing blockchain complexity — consumers, recyclers, and inspectors interact with a blockchain-backed system with no awareness of wallets, gas fees, or private keys. Integration testing confirmed hash integrity across all tested events, validating that the tamper-resistance property is operationally realized, not merely theoretical.

**Objective 3 was fully achieved.**

### Objective 4 — Mobile QR Code Scanning Interface

The mobile scanning interface operates as a browser-based web application requiring no app installation, using the native BarcodeDetector API with automatic jsQR fallback for older browsers. System testing confirmed an average QR detection time of 0.8 seconds on Chrome Android — well within the 2-second acceptance criterion — and successful operation on Safari iOS 15 via the jsQR fallback. The interface's performance and cross-browser compatibility make it practically viable for high-volume field use by recyclers and inspectors in the Liberian context.

**Objective 4 was fully achieved.**

### Objective 5 — EcoCredits Incentive Mechanism

The EcoCredits system awards 10 digital tokens per device registration through a server-side Edge Function that cannot be triggered or manipulated from client-side code. Unit testing confirmed that direct client-side INSERT attempts into the eco_credits table are blocked by RLS policy, preventing fraudulent self-award. The mechanism provides an immediate, quantifiable reward that shifts the incentive calculus in favor of formal engagement with the recycling system. The architecture is designed to accommodate future redemption pathways — mobile money integration, retailer partnerships, or government EPR schemes — without structural change.

**Objective 5 was fully achieved.**

### Objective 6 — Deployment, Testing, and Evaluation

EcoLedger is deployed and operational across Vercel (frontend), Supabase production (backend), and Ethereum Sepolia (smart contract). The three-phase testing programme of 47 tests returned a 100% pass rate across unit, integration, and system levels. All functional requirements for all four user roles were verified in the live production environment. All non-functional requirements — performance, security, data integrity, usability, and cross-browser compatibility — were confirmed satisfied. Deployment on a live public testnet means blockchain integration results reflect real network behaviour, not development-environment approximations.

**Objective 6 was fully achieved.**

### Overarching Conclusion

All six objectives were fully achieved. EcoLedger exists as a functional, deployed, and rigorously tested system that directly addresses the five core problems identified in Chapter 1: the absence of device lifecycle visibility, the lack of recycler accountability, the absence of consumer incentives, data integrity vulnerabilities in conventional records, and the regulatory blind spots facing environmental inspectors. The project demonstrates that the combination of React, Supabase Row Level Security, Ethereum smart contracts, and Privy embedded wallet abstraction can produce a practical, usable, and trustworthy environmental governance tool in a low-resource, post-conflict developing-country context — a contribution with implications beyond Liberia for comparable governance challenges across Sub-Saharan Africa.

---

## 6.3 Recommendations

### Recommendation 1 — Establish a Formal EcoCredits Redemption Ecosystem

The current EcoCredits implementation awards credits but provides no redemption pathway. To maximize behavioral impact, a formal redemption ecosystem should be developed in a subsequent phase. Options include partnerships with registered electronics retailers in Monrovia to accept EcoCredits as discount vouchers, or integration with MTN Mobile Money — which operates in Liberia — to enable credit-to-cash conversion. The technical architecture already supports this extension; the primary work required is institutional partnership negotiation.

### Recommendation 2 — Migrate to Ethereum Layer 2 for Production

EcoLedger currently operates on the Ethereum Sepolia testnet, appropriate for development and evaluation but unsuitable for long-term production use as testnet records carry no legal or evidential weight and networks can be deprecated. For production deployment, migration to an Ethereum Layer 2 network such as Polygon or Arbitrum is recommended. Layer 2 networks provide the same security guarantees as the Ethereum mainnet at a fraction of the transaction cost — critical for a platform that may process thousands of lifecycle events per day at national scale. The smart contract code requires no modification; only network configuration in the Edge Function and Privy wallet settings need updating.

### Recommendation 3 — Pursue Formal EPA-Liberia Partnership and Legal Recognition

EcoLedger currently operates as a technical platform without formal legal recognition by the Liberian government. For the platform to fulfill its potential as an environmental governance tool, formal partnership with EPA-Liberia is essential. This should establish the EPA as the designated system administrator, grant legal recognition to EcoLedger records as evidence admissible in regulatory proceedings, and integrate the platform's data outputs into the EPA's formal environmental reporting. International development organizations active in Liberia's environmental governance sector — including UNEP and USAID — are natural facilitators for this engagement.

### Recommendation 4 — Expand to Other West African Countries

The conditions underpinning EcoLedger's design — rapid device adoption, absent formal e-waste management, limited regulatory enforcement capacity — are shared by Sierra Leone, Guinea, Côte d'Ivoire, Togo, and other West African nations. EcoLedger's architecture was designed with regional extensibility in mind. Adapting the platform for a second country requires primarily configuration changes: branding customization, language localization, and establishment of country-specific administrator accounts. A phased expansion beginning with Sierra Leone is recommended, as its context most closely resembles Liberia's. Such expansion would also generate comparative data enabling more robust academic and policy analysis of what works across different national e-waste governance environments.

---

## 6.4 Final Remarks

EcoLedger does not claim to solve Liberia's e-waste problem. E-waste management is ultimately a challenge of governance, behavior, institutional capacity, and economic incentive — dimensions no technology platform can address alone. What EcoLedger creates is the informational infrastructure without which effective governance is impossible: a reliable, tamper-resistant, inclusive record of what happens to electronic devices, and a mechanism that makes responsible behavior more rewarding than the alternative. As Liberia continues its development trajectory — with growing mobile penetration, expanding digital literacy, and increasing international attention to environmental governance — the conditions for EcoLedger's success will only improve. The platform is ready; the next step belongs to the institutions and communities it was built to serve.

---

## References

Forti, V., Baldé, C. P., Kuehr, R., & Bel, G. (2020). *The global e-waste monitor 2020*. United Nations University.

Osibanjo, O., & Nnorom, I. C. (2007). The challenge of electronic waste management in developing countries. *Waste Management & Research*, 25(6), 489–501.

Tapscott, D., & Tapscott, A. (2016). *Blockchain revolution*. Portfolio/Penguin.

Walls, M. (2011). Deposit-refund systems in practice and theory. In *Moving to markets in environmental regulation* (pp. 260–292). Oxford University Press.

World Bank. (2021). *Liberia overview*. The World Bank Group. Retrieved from https://www.worldbank.org/en/country/liberia/overview
