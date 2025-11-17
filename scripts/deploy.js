import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// Load ABI + BYTECODE
const artifact = JSON.parse(
  fs.readFileSync("./artifacts/contracts/FileRegistry.sol/FileRegistry.json", "utf8")
);

// Accept input arg: Polygon / Avalanche / MST or 1 / 2 / 3
const input = process.argv[2];

const NETWORK_MAP = {
  1: "Polygon",
  2: "Avalanche",
  3: "MST",
  Polygon: "Polygon",
  Avalanche: "Avalanche",
  MST: "MST",
};

const RPC_MAP = {
  Polygon: process.env.POLYGON_AMOY_RPC,
  Avalanche: process.env.AVAX_FUJI_RPC,
  MST: process.env.MST_TESTNET_RPC,
};

async function main() {
  const network = NETWORK_MAP[input];

  if (!network) {
    console.error("❌ Invalid network input:", input);
    console.error("Use one of: 1, 2, 3 or Polygon, Avalanche, MST");
    process.exit(1);
  }

  const rpcUrl = RPC_MAP[network];
  const privateKey = process.env.PRIVATE_KEY;

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`Deploying on: ${network}`);
  console.log("Using RPC:", rpcUrl);
  console.log("Deployer Address:", wallet.address);

  const factory = new ethers.ContractFactory(
    artifact.abi,
    artifact.bytecode,
    wallet
  );

  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("DEPLOYED_ADDRESS:", address);
}

main().catch(console.error);
