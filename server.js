import "dotenv/config";
import express from "express";
import cors from "cors";
import { exec } from "child_process";

const app = express();
app.use(express.json());
app.use(cors());

// Supported numerical mapping for API payload
const NETWORK_ID_MAP = {
  1: "Polygon",
  2: "Avalanche",
  3: "MST"
};

function deployViaCLI(networkNumber) {
  return new Promise((resolve, reject) => {
    const networkName = NETWORK_ID_MAP[networkNumber];

    if (!networkName) {
      return reject(`Invalid network ID: ${networkNumber}`);
    }

    // Run normal Node script
    const cmd = `node scripts/deploy.js ${networkNumber}`;

    exec(cmd, (err, stdout, stderr) => {
      if (err) return reject(stderr || stdout);

      const match = stdout.match(/DEPLOYED_ADDRESS:\s*(0x[a-fA-F0-9]{40})/);

      if (!match) return reject("Could not find deployed address");

      resolve({
        networkName,
        address: match[1],
        fullOutput: stdout
      });
    });
  });
}

app.post("/deploy", async (req, res) => {
  try {
    const { networkId } = req.body; // client sends number

    if (!NETWORK_ID_MAP[networkId]) {
      return res.status(400).json({
        error: true,
        message: `Invalid networkId. Use 1, 2, or 3`
      });
    }

    const result = await deployViaCLI(networkId);

    res.json({
      success: true,
      network: result.networkName,
      contractAddress: result.address
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: true,
      message: err.toString()
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Deployment API running on port ${PORT}`);
});
