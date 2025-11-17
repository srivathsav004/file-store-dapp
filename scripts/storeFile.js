import { ethers } from "ethers";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

// args: networkId, contractAddress, cid, nameJson
const networkId = process.argv[2];
const contractAddress = process.argv[3];
const cid = process.argv[4];
let nameArg = process.argv[5] || "";

try {
  // If nameArg is JSON stringified, parse it; otherwise, use raw
  if (nameArg?.startsWith("\"") || nameArg?.startsWith("'")) {
    nameArg = JSON.parse(nameArg);
  }
} catch (_) {
  // ignore parse errors; keep as raw
}

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
  if (!networkId || !contractAddress || !cid) {
    console.error("Usage: node scripts/storeFile.js <networkId> <contractAddress> <cid> [name]");
    process.exit(1);
  }

  const network = NETWORK_MAP[networkId] || NETWORK_MAP[Number(networkId)];
  if (!network) {
    console.error("❌ Invalid network input:", networkId);
    process.exit(1);
  }

  const rpcUrl = RPC_MAP[network];
  const privateKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    console.error("Missing RPC URL or PRIVATE_KEY in env");
    process.exit(1);
  }

  const artifact = JSON.parse(
    fs.readFileSync("./artifacts/contracts/FileRegistry.sol/FileRegistry.json", "utf8")
  );

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log("Network:", network);
  console.log("Caller:", wallet.address);
  console.log("Contract:", contractAddress);
  console.log("CID:", cid);
  console.log("Name:", nameArg || "");

  const contract = new ethers.Contract(contractAddress, artifact.abi, wallet);
  const tx = await contract.storeFile(cid, nameArg || "");
  console.log("TX Hash:", tx.hash);
  const rcpt = await tx.wait();
  console.log("Mined in block:", rcpt.blockNumber);
  // Emit structured result for API to parse
  console.log("RESULT:", JSON.stringify({ txHash: tx.hash, blockNumber: rcpt.blockNumber }));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
