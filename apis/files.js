import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import { exec } from "child_process";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const EXPLORER_TX_BASE = {
  1: "https://amoy.polygonscan.com/tx/",
  2: "https://testnet.snowtrace.io/tx/",
  3: "https://testnet.mstscan.com/tx/",
};

function storeOnChainViaCLI({ networkId, contractAddress, valueToStore, name }) {
  return new Promise((resolve, reject) => {
    const safeName = name ? JSON.stringify(name) : "\"\""; // ensure quotes/escaping
    const cmd = `node scripts/storeFile.js ${networkId} ${contractAddress} ${valueToStore} ${safeName}`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout);
      // Parse the RESULT JSON line
      const match = String(stdout).match(/RESULT:\s*(\{.*\})/);
      if (match) {
        try {
          const parsed = JSON.parse(match[1]);
          return resolve(parsed);
        } catch (_) {
          // fallthrough
        }
      }
      resolve({ raw: stdout });
    });
  });
}

router.post("/files/upload-and-store", upload.single("file"), async (req, res) => {
  try {
    const { networkId, contractAddress, name } = req.body;
    console.log("[FILES] Request received", {
      networkId,
      contractAddress,
      name: name || null,
      hasFile: !!req.file,
    });
    if (!req.file) {
      return res.status(400).json({ error: true, message: "file is required (multipart/form-data, field name 'file')" });
    }
    if (!networkId || !contractAddress) {
      return res.status(400).json({ error: true, message: "networkId and contractAddress are required" });
    }

    // Build form-data for Pinata
    const form = new FormData();
    form.append("file", req.file.buffer, { filename: req.file.originalname, contentType: req.file.mimetype });

    // Optional metadata
    const pinataMetadata = { name: name || req.file.originalname };
    form.append("pinataMetadata", JSON.stringify(pinataMetadata));

    const pinataURL = "https://api.pinata.cloud/pinning/pinFileToIPFS";

    const headers = form.getHeaders();
    if (!process.env.PINATA_JWT) {
      console.error("[FILES] Missing PINATA_JWT in environment");
      return res.status(500).json({ error: true, message: "Pinata credentials missing. Set PINATA_JWT" });
    }
    const authHeaders = { Authorization: `Bearer ${process.env.PINATA_JWT}` };

    console.log("[FILES] Uploading to Pinata", { filename: req.file.originalname, size: req.file.size });
    const pinRes = await axios.post(pinataURL, form, { headers: { ...headers, ...authHeaders }, maxBodyLength: Infinity });

    const { IpfsHash } = pinRes.data; // CID v0/v1
    const cid = IpfsHash;
    const ipfsUrl = `ipfs://${cid}`;
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;
    console.log("[FILES] Pinata upload success", { cid, ipfsUrl, gatewayUrl });

    // Store on-chain via CLI script
    // As requested: store the gateway URL on-chain (as the file URL string)
    console.log("[FILES] Storing on-chain", { networkId, contractAddress, store: gatewayUrl });
    const txInfo = await storeOnChainViaCLI({ networkId, contractAddress, valueToStore: gatewayUrl, name: name || req.file.originalname });
    console.log("[FILES] On-chain store done", txInfo);

    const explorerTxUrl = txInfo.txHash ? `${EXPLORER_TX_BASE[networkId]}${txInfo.txHash}` : undefined;

    res.json({ success: true, cid, ipfsUrl, gatewayUrl, txHash: txInfo.txHash, blockNumber: txInfo.blockNumber, explorerTxUrl });
  } catch (err) {
    console.error("[FILES] Error", err?.response?.data || err?.message || err);
    const message = err?.response?.data || err?.message || err?.toString?.() || "Unknown error";
    res.status(500).json({ error: true, message });
  }
});

export default router;
