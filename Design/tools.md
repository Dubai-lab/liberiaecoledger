Appendix · Build stack & projected cost
Building tools & what they cost
The platform can be delivered end-to-end without any IoT hardware. Everything below is the live stack as of May 2026 — costs verified against vendor pricing pages. Free tiers cover the entire pilot phase; paid tiers only kick in once the platform has thousands of active users (a good problem to have).

Frontend
Free · Open source
React + Vite · TailwindCSS · shadcn/ui
The web app (regulator, manufacturer, recycler, NGO consoles). Industry-standard stack, huge talent pool, runs anywhere.

Hosting on Vercel free tier — $0 for the pilot
Custom domain — ~$12 / year
Mobile
Free · Open source
React Native (Expo)
One codebase ships to both iOS and Android. Used by the consumer companion app for scanning, signing, and rewards.

Google Play developer account — $25 one-time
Apple Developer Program — $99 / year
Expo EAS Build free tier covers most pilots
Backend
Free → ~$25/mo
Supabase
Auth, Postgres database (profiles, receipts, photos metadata), Storage for evidence files, Edge Functions, Realtime dashboards.

Free tier — 500 MB DB, 1 GB storage, 50k users (pilot scale)
Pro tier — $25 / month once you outgrow free
Smart contracts
Solidity itself is FREE
Solidity + Hardhat
The programming language used to write the smart contracts (DeviceRegistry, OwnershipRegistry, DisposalRegistry, IncentiveVault, etc.). It is open-source — you pay nothing to write or compile contracts.

The only cost is gas — the network fee to deploy and run contracts on Polygon:

Polygon Amoy testnet: $0 — use faucet POL during development
Polygon mainnet deployment (one-time, all 9 contracts): ≈ $5 – $15 total
Per transaction (register, transfer, dispose): ≈ $0.01 each
1,000 device registrations per month ≈ $10 / month in gas
Polygon was chosen specifically because it inherits Ethereum's security but costs roughly 1,000× less. Ethereum mainnet would be $500–$5,000 per deployment.
Wallet onboarding
Free under 499 active users
Privy
Lets consumers sign in with email or phone and creates a crypto wallet for them automatically — no MetaMask, no seed phrases. This is what makes the platform usable for non-crypto users.

Pricing (live as of May 2026):

Free tier: up to 499 monthly active wallets — perfect for the pilot
Core tier: $299 / month for up to 2,500 active wallets
Above 10,000 wallets: custom usage-based pricing
50,000 free signatures per month included on all paid plans
For the pilot: $0 / month. The platform only starts paying for Privy once it has a few hundred regularly-active users.
File storage (chain-friendly)
Free tier
Pinata · IPFS
Where receipt photos, dismantling evidence, and certificates live so their hash can be referenced on chain (immutable, tamper-proof).

Free tier — 1 GB storage, 100k requests / month
Paid tier — $20 / month once exceeded
Developer environment
Free
VS Code · GitHub · Hardhat · Ethers.js
The day-to-day tools used to write, test, version-control, and deploy the code. Industry-standard and free.

GitHub free for public repos / private with limits
All language tooling open-source
Misc · one-time / yearly
≈ $135 / year
Domain, store fees, audits
Domain name — ~$12 / year
Apple Developer — $99 / year
Google Play — $25 one-time
Optional smart-contract audit before production — $2k – $20k
Pilot phase (under 500 users)
≈ $20 – $40 / month
Mostly Polygon gas + Supabase free tier + Privy free tier
Growth phase (~2,500 users)
≈ $350 – $400 / month
Privy Core ($299) + Supabase Pro ($25) + Pinata paid + Polygon gas
One-time setup
≈ $150 + audit (optional)
Domain, store fees, mainnet deployment of 9 smart contracts
Every figure above is conservative — the platform can run a working pilot with real users for under $50/month in services, plus the team's own time. Once the platform proves traction with regulators or a manufacturer partner, the larger numbers become covered by EPR fees, grants, or take-back partnerships.

You can modify design if neccessary this was the once I was able to get for building this project.