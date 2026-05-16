require("@nomicfoundation/hardhat-ethers");
require("dotenv").config();

const PRIVATE_KEY  = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const AMOY_RPC     = process.env.AMOY_RPC_URL || "https://rpc-amoy.polygon.technology";
const SEPOLIA_RPC  = process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  paths: {
    sources: "./sol",
  },
  networks: {
    amoy: {
      url: AMOY_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    },
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 11155111,
    },
  },
};
