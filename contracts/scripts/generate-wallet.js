const { ethers } = require("ethers");

const wallet = ethers.Wallet.createRandom();

console.log("=== NEW DEPLOYER WALLET ===");
console.log("Address    :", wallet.address);
console.log("Private Key:", wallet.privateKey);
console.log("");
console.log("STEP 1 — Copy your address and get free test POL:");
console.log("  https://faucet.polygon.technology");
console.log("");
console.log("STEP 2 — Create contracts/.env with:");
console.log(`  DEPLOYER_PRIVATE_KEY=${wallet.privateKey}`);
console.log("  AMOY_RPC_URL=https://rpc-amoy.polygon.technology");
console.log("");
console.log("STEP 3 — Run deployment:");
console.log("  npm run deploy");
console.log("===========================");
