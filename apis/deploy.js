import express from "express";
import { exec } from "child_process";

const router = express.Router();

// Supported numerical mapping for API payload
const NETWORK_ID_MAP = {
  1: "Polygon",
  2: "Avalanche",
  3: "MST"
};

const EXPLORER_TX_BASE = {
  1: "https://amoy.polygonscan.com/tx/",
  2: "https://testnet.snowtrace.io/tx/",
  3: "https://testnet.mstscan.com/tx/",
};

const EXPLORER_ADDRESS_BASE = {
  1: "https://amoy.polygonscan.com/address/",
  2: "https://testnet.snowtrace.io/address/",
  3: "https://testnet.mstscan.com/address/",
};

function deployViaCLI(networkNumber) {
  return new Promise((resolve, reject) => {
    const networkName = NETWORK_ID_MAP[networkNumber];

    if (!networkName) {
      return reject(`Invalid network ID: ${networkNumber}`);
    }

    const cmd = `node scripts/deploy.js ${networkNumber}`;
    console.log("[DEPLOY] Spawning CLI", { networkNumber, cmd });

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.error("[DEPLOY] CLI error", stderr || stdout);
        return reject(stderr || stdout);
      }
      console.log("[DEPLOY] CLI finished");

      const addrMatch = stdout.match(/DEPLOYED_ADDRESS:\s*(0x[a-fA-F0-9]{40})/);
      if (!addrMatch) return reject("Could not find deployed address");

      let parsed = {};
      const resultMatch = String(stdout).match(/RESULT:\s*(\{.*\})/);
      if (resultMatch) {
        try { parsed = JSON.parse(resultMatch[1]); } catch (_) {}
      }

      resolve({
        networkName,
        address: addrMatch[1],
        txHash: parsed.txHash,
        blockNumber: parsed.blockNumber,
        fullOutput: stdout
      });
    });
  });
}

router.post("/deploy", async (req, res) => {
  try {
    const { networkId } = req.body;
    console.log("[DEPLOY] Request received", { networkId });

    if (!NETWORK_ID_MAP[networkId]) {
      return res.status(400).json({
        error: true,
        message: `Invalid networkId. Use 1, 2, or 3`
      });
    }

    const result = await deployViaCLI(networkId);
    console.log("[DEPLOY] Success", { network: result.networkName, address: result.address });

    const txExplorer = result.txHash ? `${EXPLORER_TX_BASE[networkId]}${result.txHash}` : undefined;
    const addressExplorer = result.address ? `${EXPLORER_ADDRESS_BASE[networkId]}${result.address}` : undefined;

    res.json({
      success: true,
      network: result.networkName,
      contractAddress: result.address,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      explorerTxUrl: txExplorer,
      explorerAddressUrl: addressExplorer
    });
  } catch (err) {
    console.error("[DEPLOY] Error", err);
    res.status(500).json({ error: true, message: err.toString() });
  }
});

export default router;
