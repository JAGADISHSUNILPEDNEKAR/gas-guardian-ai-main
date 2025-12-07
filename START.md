# 🚀 GasGuard Mentor - Quick Start Commands

## Prerequisites Check

Pehle yeh verify karein:
- ✅ Node.js 18+ installed
- ✅ PostgreSQL running
- ✅ Redis running

## Step-by-Step Commands

### 1️⃣ Terminal 1: Backend Start

```bash
cd backend
npm install
npm run dev
```

Backend `http://localhost:8080` par chalega.

### 2️⃣ Terminal 2: Frontend Start

```bash
# Root directory se (gas-guardian-ai-main)
npm install
npm run dev
```

Frontend `http://localhost:5173` par chalega.

---

## Complete Setup (First Time Only)

Agar pehli baar setup kar rahe ho, yeh sab run karein:

### Step 1: Install Dependencies

```bash
# Root directory me
npm install

# Backend dependencies
cd backend
npm install
cd ..
```

### Step 2: Database Setup

```bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

### Step 3: Environment Files

**Backend `.env` file create karein:**
```bash
cd backend
# .env file create karein aur yeh add karein:
```

```env
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/gasguard
REDIS_URL=redis://localhost:6379
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
CHAIN_ID=114
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
FDC_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000004
OPENAI_API_KEY=your_openai_key_here
JWT_SECRET=random_secret_here
```

**Root `.env` file create karein:**
```env
VITE_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_CHAIN_ID=114
VITE_FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

### Step 4: Deploy Contracts (Optional - Testnet ke liye)

```bash
# Test FLR chahiye pehle: https://faucet.flare.network/coston2
# backend/.env me PRIVATE_KEY add karein

npm run deploy:coston2

# Deployed addresses ko .env files me update karein
```

---

## Daily Use Commands

### Quick Start (Already Setup Ho To)

**Terminal 1:**
```bash
cd backend
npm run dev
```

**Terminal 2:**
```bash
npm run dev
```

### Stop Karne Ke Liye

- `Ctrl + C` dono terminals me

---

## Troubleshooting

### Backend Start Nahi Ho Raha?

```bash
# PostgreSQL check
pg_isready

# Redis check  
redis-cli ping

# Database migrate
cd backend
npx prisma migrate dev
```

### Frontend Start Nahi Ho Raha?

```bash
# Dependencies reinstall
rm -rf node_modules
npm install

# Clear cache
npm run dev -- --force
```

### Port Already In Use?

```bash
# Backend port change (backend/.env)
PORT=3000

# Frontend port change (vite.config.ts me)
```

---

## Important URLs

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8080/api
- **WebSocket**: ws://localhost:8080

---

## Next Steps

1. Browser me kholo: http://localhost:5173
2. MetaMask connect karo
3. Flare Coston2 network add karo (Chain ID: 114)
4. Test FLR le lo: https://faucet.flare.network/coston2

---

**Note**: Agar koi error aaye to console me check karein aur mujhe batao! 🚀

