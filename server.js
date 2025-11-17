import "dotenv/config";
import express from "express";
import cors from "cors";
import deployRouter from "./apis/deploy.js";
import filesRouter from "./apis/files.js";

const app = express();
app.use(express.json());
app.use(cors());

// Mount APIs
app.use("/api", deployRouter);
app.use("/api", filesRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Deployment API running on port ${PORT}`);
});
