# Gas-Guard

Welcome! This repository contains Gas-Guard — a full-stack project that monitors blockchain gas prices, runs predictive models to help optimize transaction timing, and provides a web dashboard and AI assistant to help users make cost-effective decisions.

**Quick summary:**
- Purpose: Real-time gas monitoring + AI predictions for the Flare network (and similar EVM chains).
- Components: Frontend (Vite + React + TypeScript), Backend (Node.js + Express + Prisma), Smart Contracts (Hardhat), AI utilities (Python scripts).

- ## Project Description

**Problem:** Gas fees on blockchain networks can be expensive and unpredictable. Users often overpay for transactions without knowing the optimal time to execute them, and comparing gas costs across different chains is tedious and error-prone.

**Solution:** Gas-Guard AI is an intelligent monitoring and optimization platform that:
1. **Tracks gas prices in real-time** across the Flare network (and comparable EVM chains) using Flare's FTSOv2 oracle and FDC data connectors.
2. **Predicts gas trends** using AI/ML models trained on historical data, suggesting optimal times for users to execute transactions and save money.
3. **Compares chains** — users can see gas costs side-by-side across Ethereum, Polygon, BSC, Avalanche, and Flare to pick the cheapest option.
4. **Provides smart account integration** — works seamlessly with Flare Smart Accounts for secure, gasless-like transaction execution.
5. **Offers an AI assistant** — a chat interface that answers questions about gas fees, gives personalized recommendations, and explains why certain times are better to transact.

**Why Flare?** Gas-Guard AI uses Flare's FTSOv2 oracle for accurate, decentralized price data and FDC to pull cross-chain gas information. This ensures predictions are based on real, on-chain data — not centralized APIs or estimates.

**Who is it for?**
- Users who want to minimize gas costs on their transactions.
- DeFi traders who need to time their moves during low-fee windows.
- Developers and projects that want to understand gas trends and optimize user experience.
- Anyone interested in Flare network capabilities (FTSOv2, FDC, Smart Accounts).

<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 16 PM" src="https://github.com/user-attachments/assets/57f077d9-831f-4e4a-a3c9-695247868284" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 24 PM" src="https://github.com/user-attachments/assets/03624351-cabd-4ea1-864d-e6361db4179d" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 36 PM" src="https://github.com/user-attachments/assets/14dc8ed1-2c67-410f-9838-0166b8a48e7c" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 43 PM" src="https://github.com/user-attachments/assets/4c6bb1e5-7f0b-4c96-bd66-fb8cd3d9c7db" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 50 PM" src="https://github.com/user-attachments/assets/16b84418-8079-4954-8070-a51f145a4ea8" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 17 57 PM" src="https://github.com/user-attachments/assets/73f31f37-c844-4270-8c5b-3d07b9efba72" />
<img width="1440" height="900" alt="Screenshot 2025-12-07 at 1 18 08 PM" src="https://github.com/user-attachments/assets/114bfe42-bcd4-4624-aa25-70484118b57c" />


**Table of contents**
- Project highlights
- Repo structure (key folders)
- Prerequisites
- Quickstart (dev) — PowerShell commands
- Backend setup 
- Contracts: compile, test, deploy
- Running with Docker (infra)
- Testing and linting
- Troubleshooting & notes
- Contributing

**Project highlights**
- Real-time gas price fetching and monitoring (services in `backend/src/jobs`).
- Frontend UI with charts, chat assistant, and wallet integration (React components in `src/components`).
- Smart contract layer in `contracts/` with  scripts and tests.

---

**Important Flare links**
- Getting started / Env setup: https://dev.flare.network/network/getting-started
- Faucet (Coston2): https://faucet.flare.network/coston2
- Block explorer (Coston2): https://coston2-explorer.flare.network/
- MetaMask (Chrome): https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en
- Flare Testnet config (ChainList): https://chainlist.org/chain/114
- FTSOv2 (docs / getting started): https://dev.flare.network/ftso/getting-started
- FDC (docs / getting started): https://dev.flare.network/fdc/getting-started
- FAssets overview: https://dev.flare.network/fassets/overview
- Bridges (developer tools): https://dev.flare.network/network/developer-tools/#bridges
- OFT (developer tools): https://dev.flare.network/network/developer-tools/#ofts
- Wallet SDKs (developer tools): https://dev.flare.network/network/developer-tools/#wallet-sdks
- Hardhat & Foundry starter guide: https://dev.flare.network/network/guides/hardhat-foundry-starter-kit

**Flare technologies used (what this project relies on)**
This project intentionally uses Flare's native data and oracle services — not just generic chain nodes — so the features here reflect real Flare integrations:

- FTSOv2: We query Flare's FTSOv2 oracle data to obtain on-chain price and gas-related signals. FTSOv2 is used as a primary oracle to inform predictions and timing suggestions.
- FDC (Flare Data Connector): We use FDC feeds and connectors to gather cross-chain and historical data for comparison between chains and for richer context when generating AI-driven recommendations.
- FAssets: The project is compatible with and aware of FAssets; where relevant we surface FAsset data in analytics and charts.
- Flare Smart Accounts: The stack supports interaction patterns and UX designed for Flare Smart Accounts where applicable.

In short: the app pulls gas and oracle signals directly from Flare services (FTSOv2, FDC, etc.), uses those feeds to power monitoring and prediction, and surfaces that information in the dashboard. 
---

**Repository layout (important parts)**
- `src/` — frontend app (Vite + React + TypeScript).
- `backend/` — backend API (TypeScript + Express + Prisma). Key files:
  - `backend/src/server.ts` — app entry
  - `backend/src/jobs/` — background jobs (pollers, fetchers, trainers)
  - `backend/src/services/` — core backend services
  - `backend/prisma/schema.prisma` — database schema
- `contracts/` — Solidity contracts, tests, and scripts.

**Prerequisites (recommendations)**
- Node.js 18+ and `npm` (or `pnpm`/`yarn`) installed.
- Python 3.8+ (if you want to run the Python scripts / model training).
- Git and a Web3 Wallet (e.g., MetaMask) for interacting with local or testnet deployments.
- Optional: Docker & Docker Compose for running services in containers.

---

## Quickstart (Development) — Windows PowerShell
These commands assume you are in the repo root (`gas-guardian-ai-main`).

1) Clone and install frontend deps
```powershell
git clone https://github.com/JAGADISHSUNILPEDNEKAR/gas-guardian-ai-main.git
cd "gas-guardian-ai-main"
npm install
```

2) Start the frontend dev server (Vite)
```powershell
npm run dev
```

3) Open a separate terminal to start the backend
```powershell
cd backend
npm install
npm run dev
```

Notes:
- Root `npm run dev` runs the frontend (`vite`).
- Backend dev uses `tsx watch src/server.ts` as defined in `backend/package.json`.

---

## Backend: setup, Prisma, and env variables
Location: `backend/`

1) Install dependencies and generate Prisma client
```powershell
cd backend
npm install
npm run generate
```

2) Migrate (development)
Ensure you set `DATABASE_URL` in `backend/.env` first. Example local SQLite or Postgres URL.
```powershell
# copy example env if present
if (Test-Path .env.example) { Copy-Item .env.example .env }

# run migrations
npm run migrate
```

3) Typical environment variables (place in `backend/.env`):
- `DATABASE_URL` — Prisma database connection string (e.g., `file:./dev.db` or Postgres URL)
- `PORT` — server port (default usually 3000 or 4000)
- `JWT_SECRET` — for auth tokens
- `OPENAI_API_KEY` — if using OpenAI features
- `PRIVATE_KEY` or `MNEMONIC` — for contract deploy scripts (keep secrets safe)

Check `backend/src/config` for exact env keys used by the server.

---

## Smart Contracts (Hardhat)
Location: `contracts/` (root also has Hardhat config)

Commands (from repo root):
```powershell
# run hardhat tests (root `test` script calls hardhat test)
npm run test

# or inside contracts folder
cd contracts
npm install
npm test

# compile
npm run compile

# run a local Hardhat node
npm run node

# deploy to testnet (example from root scripts)
npm run deploy:coston2
# or
npm run deploy:flare
```

Note: Deployment scripts call `scripts/deploy/deployGasGuard.cjs` using `hardhat.config.cjs`. Make sure your deploy env vars (RPC URL, private key) are set.

---


## Docker / Local multi-service (infra)
The `infra/docker` folder contains `Dockerfile.backend`, `Dockerfile.frontend`, and `docker-compose.yml` for running the stack in containers.

To run via Docker Compose (example):
```powershell
cd infra/docker
docker-compose up --build
```

This will build and start services. Check `docker-compose.yml` for mapped ports and environment variables.

---

## Testing and linting
- Frontend lint: `npm run lint` (root) — runs ESLint across project.
- Backend tests: `cd backend && npm test` (uses `jest` if tests exist).
- Contracts tests: `npm run test` (root) runs `hardhat test` via `test:contracts`.

Suggested test workflow:
1. Run contract tests: `npm run test` (root)
2. Run backend unit tests: `cd backend && npm test`

---

## Troubleshooting & common notes
- If you see Prisma errors, make sure `DATABASE_URL` is correct and run `npx prisma generate`.
- If Hardhat can't find a network RPC, verify your RPC URL env variables and the `hardhat.config.cjs` file.
- Sensitive keys: NEVER commit private keys or `.env` files to git. Use environment variables or secrets manager.
- If the frontend can't connect to backend, ensure `backend` server `PORT` is reachable and the frontend `api` base URL is configured.

Where to look in code:
- Prisma schema: `backend/prisma/schema.prisma`
- Server entry: `backend/src/server.ts`
- Frontend entry: `src/main.tsx`
- Contract source: `contracts/core/GasGuard.sol`

---

## Contributing
- Fork the repo, create a feature branch, write tests, and open a pull request.
- Use the existing code style and run linters before opening a PR: `npm run lint`.

If you add or update env variables, include `.env.example` updates and document the change in this README.

---

## License & contact
- This project is published under the MIT License (see `LICENSE`).
- For questions or to collaborate, open an issue in this repository.

---

