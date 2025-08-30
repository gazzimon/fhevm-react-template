import * as dotenv from "dotenv";
dotenv.config();

import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "hardhat-deploy";

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    localhost: { url: "http://127.0.0.1:8545" },
    sepolia: {
      url: process.env.RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  namedAccounts: {
    deployer: {
      default: 0, // primera cuenta
    },
  },
};

export default config;
