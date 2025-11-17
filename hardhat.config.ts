import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { configVariable, defineConfig } from "hardhat/config";
import * as dotenv from "dotenv";

dotenv.config();

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],

  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },

  networks: {
    Polygon: {
      type: "http",
      chainType: "l1",
      url: configVariable("POLYGON_AMOY_RPC"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    Avalanche: {
      type: "http",
      chainType: "l1",
      url: configVariable("AVAX_FUJI_RPC"),
      accounts: [configVariable("PRIVATE_KEY")],
    },

    MST: {
      type: "http",
      chainType: "l1",
      url: configVariable("MST_TESTNET_RPC"),
      accounts: [configVariable("PRIVATE_KEY")],
    },
  },
});
