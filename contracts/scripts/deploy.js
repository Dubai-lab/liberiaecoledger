const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL");

  // 1. Deploy EcoToken
  console.log("\n--- Deploying EcoToken ---");
  const EcoToken = await hre.ethers.getContractFactory("EcoToken");
  const ecoToken = await EcoToken.deploy();
  await ecoToken.waitForDeployment();
  const ecoTokenAddress = await ecoToken.getAddress();
  console.log("EcoToken deployed at:", ecoTokenAddress);

  // 2. Deploy EcoLedger (pass EcoToken address)
  console.log("\n--- Deploying EcoLedger ---");
  const EcoLedger = await hre.ethers.getContractFactory("EcoLedger");
  const ecoLedger = await EcoLedger.deploy(ecoTokenAddress);
  await ecoLedger.waitForDeployment();
  const ecoLedgerAddress = await ecoLedger.getAddress();
  console.log("EcoLedger deployed at:", ecoLedgerAddress);

  // 3. Transfer EcoToken ownership to EcoLedger so it can mint
  console.log("\n--- Transferring EcoToken ownership to EcoLedger ---");
  const tx = await ecoToken.transferOwnership(ecoLedgerAddress);
  await tx.wait();
  console.log("Ownership transferred.");

  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("EcoToken  :", ecoTokenAddress);
  console.log("EcoLedger :", ecoLedgerAddress);
  console.log("=========================================");
  console.log("\nSave these addresses in your .env file:");
  console.log(`VITE_ECOTOKEN_ADDRESS=${ecoTokenAddress}`);
  console.log(`VITE_ECOLEDGER_ADDRESS=${ecoLedgerAddress}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
