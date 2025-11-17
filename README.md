# File Store DApp – API Documentation

Minimal Express APIs to:
- Deploy the `FileRegistry` contract to testnets.
- Upload a file to Pinata IPFS and store its gateway URL on-chain.

The server shells out to CLI scripts (ethers v6) for signing and sending transactions.

## Setup

- Environment variables (`.env`):
  - `PINATA_JWT` – Pinata JWT token
  - `PRIVATE_KEY` – EOA private key (0x...)
  - `POLYGON_AMOY_RPC` – Polygon Amoy RPC URL
  - `AVAX_FUJI_RPC` – Avalanche Fuji RPC URL
  - `MST_TESTNET_RPC` – MST Testnet RPC URL
  - `PORT` – Optional, defaults to `3000`

- Install deps
  ```bash
  npm i
  npm i multer axios form-data
  ```

- Build contract (ensure artifacts exist)
  ```bash
  npx hardhat compile
  ```

- Start server
  ```bash
  node server.js
  ```

## Networks

`networkId` mapping:
- 1 → Polygon Amoy (https://amoy.polygonscan.com/)
- 2 → Avalanche Fuji (https://testnet.snowtrace.io/)
- 3 → MST Testnet (https://testnet.mstscan.com/)

---

## POST /api/deploy
Deploy the `FileRegistry` contract to a selected testnet.

- URL: `/api/deploy`
- Method: `POST`
- Body (JSON):
  ```json
  { "networkId": 1 }
  ```
- Success response:
  ```json
  {
    "success": true,
    "network": "Polygon",
    "contractAddress": "0x...",
    "txHash": "0x...",
    "blockNumber": 123456,
    "explorerTxUrl": "https://amoy.polygonscan.com/tx/0x...",
    "explorerAddressUrl": "https://amoy.polygonscan.com/address/0x..."
  }
  ```
- Example:
  ```bash
  curl -X POST http://localhost:3000/api/deploy \
    -H "Content-Type: application/json" \
    -d '{"networkId":1}'
  ```

---

## POST /api/files/upload-and-store
Upload a file to Pinata IPFS and store its gateway URL on-chain via `storeFile(url, name)`.

- URL: `/api/files/upload-and-store`
- Method: `POST`
- Body (multipart/form-data):
  - `file` – binary file (field name `file`)
  - `networkId` – 1 | 2 | 3
  - `contractAddress` – deployed `FileRegistry` address
  - `name` – optional label stored on-chain
- Behavior:
  1) Uploads to Pinata using `PINATA_JWT`.
  2) Builds URLs: `ipfs://<cid>` and `https://gateway.pinata.cloud/ipfs/<cid>`.
  3) Stores the gateway URL on-chain.
- Success response:
  ```json
  {
    "success": true,
    "cid": "bafy...",
    "ipfsUrl": "ipfs://bafy...",
    "gatewayUrl": "https://gateway.pinata.cloud/ipfs/bafy...",
    "txHash": "0x...",
    "blockNumber": 789012,
    "explorerTxUrl": "https://amoy.polygonscan.com/tx/0x..."
  }
  ```
- Example:
  ```bash
  curl -X POST http://localhost:3000/api/files/upload-and-store \
    -F "file=@./path/to/your.file" \
    -F "networkId=1" \
    -F "contractAddress=0xYourDeployedAddress" \
    -F "name=optional-name"
  ```

---

## Contract
- `contracts/FileRegistry.sol`
  - `storeFile(string url, string name)` emits `FileStored` and records uploader + timestamp.
  - Read helpers: `getUserFileCount`, `getUserFile`, `getGlobalFileCount`, `getGlobalFile`.

## Logs & Limits
- Structured logs printed by the server for both endpoints.
- Upload size limit defaults to 50 MB (see `apis/files.js`).

## Notes
- Artifacts expected at `artifacts/contracts/FileRegistry.sol/FileRegistry.json`.
- Transactions are sent via CLI scripts in `scripts/` using ethers v6.
- Swap the gateway base in `apis/files.js` if you want a custom gateway.
