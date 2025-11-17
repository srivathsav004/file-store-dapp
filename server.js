import "dotenv/config";
import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import deployRouter from "./apis/deploy.js";
import filesRouter from "./apis/files.js";

const app = express();
app.use(express.json());
app.use(cors());

// Mount APIs
app.use("/api", deployRouter);
app.use("/api", filesRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

async function ensureArtifacts() {
  const artifactPath = "./artifacts/contracts/FileRegistry.sol/FileRegistry.json";
  if (fs.existsSync(artifactPath)) {
    console.log("[BOOT] Found artifacts: ", artifactPath);
    return;
  }
  console.log("[BOOT] Artifacts missing. Running 'npx hardhat compile'...");
  await new Promise((resolve, reject) => {
    exec("npx hardhat compile", (err, stdout, stderr) => {
      if (err) {
        console.error("[BOOT] Compile failed:", stderr || stdout);
        return reject(new Error(stderr || stdout));
      }
      console.log("[BOOT] Compile output:\n" + stdout);
      resolve();
    });
  });
}

const PORT = process.env.PORT || 3000;

ensureArtifacts()
  .catch((e) => {
    console.error("[BOOT] Failed to ensure artifacts:", e?.message || e);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Deployment API running on port ${PORT}`);
    });
  });
