# CHAPTER 2: LITERATURE REVIEW

---

## 2.1 Introduction

This chapter reviews existing academic and professional literature relevant to the core themes of this project: electronic waste management, blockchain technology and its applications in supply chain and environmental governance, existing e-waste tracking platforms, and digital incentive mechanisms for behavioral change. The review is organized thematically, progressing from the global e-waste problem to the specific Liberian context, and from foundational blockchain concepts to their practical application. The chapter concludes by identifying the specific research gap that EcoLedger addresses.

---

## 2.2 Electronic Waste: Definition, Scale, and Consequences

Electronic waste is defined by the Basel Convention as discarded electrical and electronic equipment and its components destined for disposal (Basel Convention, 2019). The Global E-Waste Monitor 2020 reported 53.6 million metric tonnes of e-waste generated globally in 2019 and projects this figure to reach 74.7 million metric tonnes by 2030 (Forti et al., 2020). E-waste is currently the fastest-growing solid waste stream in the world.

The health and environmental consequences of improper e-waste handling are severe. Devices contain hazardous substances including lead, mercury, cadmium, and brominated flame retardants. When devices are dismantled without environmental controls or burned in the open — as is common in informal recycling across Africa — these substances leach into soil and water. Robinson (2009) documented systematic contamination of agricultural land near informal e-waste sites, with elevated blood lead levels in children and increased respiratory disease among adult recyclers.

---

## 2.3 E-Waste in Developing Countries and Africa

A significant proportion of global e-waste flows from developed to developing countries, often disguised as second-hand goods (Baldé et al., 2017). Ghana's Agbogbloshie site in Accra became the most extensively documented example of informal e-waste processing in Africa, where thousands of workers dismantle and burn electronics daily under severely hazardous conditions (Amoyaw-Osei et al., 2011). Similar operations exist in Nigeria, Côte d'Ivoire, and across West Africa.

Regulatory responses have been limited. Ghana and Nigeria have enacted e-waste legislation, but enforcement capacity remains weak and the informal sector continues to dominate (Grant & Oteng-Ababio, 2012). Osibanjo and Nnorom (2007) argued that the core challenge in Sub-Saharan Africa is not absent policy intent but absent information infrastructure for enforcement — an observation that directly motivates EcoLedger.

---

## 2.4 The E-Waste Challenge in Liberia

Liberia's e-waste situation is particularly acute. Two civil wars (1989–2003) and the Ebola epidemic (2014–2016) left institutional infrastructure severely underdeveloped (World Bank, 2021). International development programs have supplied large quantities of electronic equipment to schools, hospitals, and government ministries, accelerating device accumulation. The Environmental Protection Agency of Liberia (EPA), established under the EPA Act of 2002, has no dedicated e-waste management unit, no device registry, and no certified recycling program. No prior academic study has proposed a digital lifecycle tracking solution designed specifically for the Liberian context — the gap this project addresses.

---

## 2.5 Blockchain Technology

Blockchain is a distributed, decentralized ledger in which transactions are recorded in cryptographically linked blocks and replicated across a peer-to-peer network. Nakamoto (2008) introduced the foundational concept in the context of peer-to-peer electronic cash. The underlying properties — immutability, transparency, decentralization, and tamper resistance — are applicable to any domain requiring a trustworthy shared record.

Ethereum, introduced by Buterin (2014), extended blockchain to support programmable smart contracts — self-executing code deployed on-chain that responds to inputs without relying on any central authority. Smart contracts enable automated enforcement of business rules, such as recording lifecycle events or issuing digital tokens, in a manner no single party can override (Tapscott & Tapscott, 2016). The Ethereum Sepolia testnet provides a public test environment functionally identical to the mainnet, enabling development without real transaction costs.

---

## 2.6 Blockchain in Supply Chain and Environmental Governance

Kshetri (2018) identified blockchain's capacity to address supply chain challenges including provenance tracking, counterfeit prevention, and accountability at each transfer point — properties directly applicable to device lifecycle tracking. Casino et al. (2019) identified environmental governance and circular economy management as high-value emerging application domains. IBM's Food Trust platform demonstrated blockchain-based lifecycle tracking at scale, reducing product trace times from days to seconds (Kamath, 2018).

In the e-waste domain, Liu et al. (2020) proposed a conceptual blockchain-based accountability framework for China, arguing that blockchain's immutability makes it uniquely suited to resist falsification of recycling certificates. Their work remained conceptual and was not implemented. EcoLedger builds on this foundation by delivering a fully implemented, deployed, and tested system.

---

## 2.7 Existing E-Waste Management Systems

Several formal e-waste management systems exist globally, each with limitations in the Liberian context. Extended Producer Responsibility (EPR) schemes — such as those mandated under the European Union's WEEE Directive — require manufacturers to fund and manage product collection and recycling. These depend on formal retail markets, manufacturer compliance infrastructure, and enforcement authority that Liberia does not possess (Widmer et al., 2005). Certification schemes such as e-Stewards and R2 provide standards for responsible recycling operators but are voluntary, costly, and require auditing capacity unavailable in Liberia. The United Nations' StEP Initiative provides e-waste policy frameworks for developing countries but remains advisory rather than operational. No existing platform provides a device-level digital lifecycle tracking system for low-resource West African deployment.

---

## 2.8 Incentive Mechanisms for Responsible Disposal

Behavioral economics research demonstrates that awareness campaigns alone are insufficient to change disposal behavior; effective interventions require incentives that make responsible choices more rewarding than the default (Walls, 2011). The Plastic Bank model, operating in Haiti and the Philippines, provides digital credits redeemable for goods in exchange for collected plastic waste, achieving measurable collection increases in contexts comparable to Liberia (Plastic Bank, 2020). EcoLedger's EcoCredits mechanism adapts this model to electronic device registration, awarding 10 digital tokens per registration and creating a foundation for a future redemption ecosystem.

---

## 2.9 Role-Based Information Systems

Role-Based Access Control (RBAC) is a well-established security paradigm in which access rights are assigned to roles rather than individuals (Sandhu et al., 1996). In multi-stakeholder platforms where consumers, recyclers, inspectors, and administrators have fundamentally different data access needs, RBAC provides essential security boundaries. Supabase Row Level Security (RLS) implements RBAC at the database tier itself, ensuring access boundaries are enforced independently of application-layer behavior.

---

## 2.10 Summary and Research Gap

The literature establishes that e-waste is a growing global challenge with severe consequences in Sub-Saharan Africa, that Liberia faces this challenge with virtually no formal management infrastructure, that blockchain provides a technically sound foundation for tamper-resistant lifecycle tracking, and that incentive mechanisms are necessary complements to any purely informational system. Existing platforms and regulatory frameworks are not designed for and cannot function in the Liberian context. No prior study has implemented and tested a role-based, blockchain-enabled e-waste tracking platform for Liberia or any comparable West African nation. EcoLedger fills this gap.

---

## References

Amoyaw-Osei, Y., Agyekum, O., Pwamang, J., Mueller, E., Fasko, R., & Schluep, M. (2011). *Ghana e-waste country assessment*. Basel Convention Secretariat.

Baldé, C. P., Forti, V., Gray, V., Kuehr, R., & Stegmann, P. (2017). *The global e-waste monitor 2017*. United Nations University.

Basel Convention. (2019). *Technical guidelines on transboundary movements of e-waste*. UNEP.

Buterin, V. (2014). *A next generation smart contract and decentralized application platform*. Ethereum Foundation.

Casino, F., Dasaklis, T. K., & Patsakis, C. (2019). A systematic literature review of blockchain-based applications. *Telematics and Informatics*, 36, 55–70.

Forti, V., Baldé, C. P., Kuehr, R., & Bel, G. (2020). *The global e-waste monitor 2020*. United Nations University.

Grant, R., & Oteng-Ababio, M. (2012). Mapping the invisible and real African economy: Urban e-waste circuitry. *Urban Geography*, 33(1), 1–21.

Kamath, R. (2018). Food traceability on blockchain: Walmart's pork and mango pilots with IBM. *Journal of the British Blockchain Association*, 1(1), 1–12.

Kshetri, N. (2018). Blockchain's roles in meeting key supply chain management objectives. *International Journal of Information Management*, 39, 80–89.

Liu, J., Guo, R., & Song, J. (2020). Blockchain-enabled e-waste management: A framework. *Resources, Conservation and Recycling*, 162, 105017.

Nakamoto, S. (2008). *Bitcoin: A peer-to-peer electronic cash system*. Retrieved from https://bitcoin.org/bitcoin.pdf

Osibanjo, O., & Nnorom, I. C. (2007). The challenge of electronic waste management in developing countries. *Waste Management & Research*, 25(6), 489–501.

Plastic Bank. (2020). *Impact report 2020*. Plastic Bank B Corp.

Robinson, B. H. (2009). E-waste: An assessment of global production and environmental impacts. *Science of the Total Environment*, 408(2), 183–191.

Sandhu, R. S., Coyne, E. J., Feinstein, H. L., & Youman, C. E. (1996). Role-based access control models. *IEEE Computer*, 29(2), 38–47.

Tapscott, D., & Tapscott, A. (2016). *Blockchain revolution*. Portfolio/Penguin.

Walls, M. (2011). Deposit-refund systems in practice and theory. In *Moving to markets in environmental regulation* (pp. 260–292). Oxford University Press.

Widmer, R., Oswald-Krapf, H., Sinha-Khetriwal, D., Schnellmann, M., & Böni, H. (2005). Global perspectives on e-waste. *Environmental Impact Assessment Review*, 25(5), 436–458.

World Bank. (2021). *Liberia overview*. The World Bank Group. Retrieved from https://www.worldbank.org/en/country/liberia/overview
