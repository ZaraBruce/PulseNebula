import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "hardhat-deploy";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "dotenv/config";

const PRIVATE_KEY: string = process.env.PRIVATE_KEY ?? vars.get("PRIVATE_KEY", "");
const INFURA_API_KEY: string = process.env.INFURA_API_KEY ?? vars.get("INFURA_API_KEY", "");
const SEPOLIA_RPC: string =
  process.env.SEPOLIA_RPC ??
  vars.get("SEPOLIA_RPC", INFURA_API_KEY ? `https://sepolia.infura.io/v3/${INFURA_API_KEY}` : "https://ethereum-sepolia-rpc.publicnode.com");
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY ?? vars.get("ETHERSCAN_API_KEY", "");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: ETHERSCAN_API_KEY,
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      url: SEPOLIA_RPC,
      chainId: 11155111,
      accounts: PRIVATE_KEY && PRIVATE_KEY.length > 0 ? [PRIVATE_KEY] : undefined,
    },
  },
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
    deploy: "./deploy",
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;

