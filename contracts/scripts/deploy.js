const hre = require("hardhat");

// EcoToken already deployed — reuse it to save POL
const EXISTING_ECOTOKEN = "0xd38088CCE0a62A09EeaFA4519c7c5baAc9a589B8";

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "POL");

  let ecoTokenAddress = EXISTING_ECOTOKEN;

  if (ecoTokenAddress) {
    console.log("\n--- Reusing existing EcoToken at:", ecoTokenAddress, "---");
  } else {
    console.log("\n--- Deploying EcoToken ---");
    const EcoToken = await hre.ethers.getContractFactory("EcoToken");
    const ecoToken = await EcoToken.deploy();
    await ecoToken.waitForDeployment();
    ecoTokenAddress = await ecoToken.getAddress();
    console.log("EcoToken deployed at:", ecoTokenAddress);
  }

  // Deploy EcoLedger
  console.log("\n--- Deploying EcoLedger ---");
  const EcoLedger = await hre.ethers.getContractFactory("EcoLedger");
  const ecoLedger = await EcoLedger.deploy(ecoTokenAddress);
  await ecoLedger.waitForDeployment();
  const ecoLedgerAddress = await ecoLedger.getAddress();
  console.log("EcoLedger deployed at:", ecoLedgerAddress);

  // Transfer EcoToken ownership to EcoLedger so it can mint
  console.log("\n--- Transferring EcoToken ownership to EcoLedger ---");
  const EcoToken = await hre.ethers.getContractFactory("EcoToken");
  const ecoToken = EcoToken.attach(ecoTokenAddress);
  const tx = await ecoToken.transferOwnership(ecoLedgerAddress);
  await tx.wait();
  console.log("Ownership transferred. EcoLedger can now mint ECO tokens.");

  console.log("\n========== DEPLOYMENT COMPLETE ==========");
  console.log("EcoToken  :", ecoTokenAddress);
  console.log("EcoLedger :", ecoLedgerAddress);
  console.log("=========================================");
  console.log("\nAdd these to your frontend .env:");
  console.log(`VITE_ECOTOKEN_ADDRESS=${ecoTokenAddress}`);
  console.log(`VITE_ECOLEDGER_ADDRESS=${ecoLedgerAddress}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
