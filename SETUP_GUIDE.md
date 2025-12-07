# GasGuard Mentor - Complete Setup Guide

## 🎯 Overview

This guide will help you set up GasGuard Mentor from scratch on Flare Coston2 Testnet.

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] MetaMask browser extension installed
- [ ] OpenAI API key (for AI chat feature)
- [ ] Test FLR tokens from faucet

## 🔧 Step-by-Step Setup

### Step 1: Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install contract dependencies (if not already installed)
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### Step 2: Setup Database

```bash
cd backend

# Create database (PostgreSQL)
# On Linux/Mac:
createdb gasguard

# On Windows (using psql):
# psql -U postgres
# CREATE DATABASE gasguard;

# Run migrations
npx prisma migrate dev
npx prisma generate

cd ..
```

### Step 3: Configure Environment Variables

**Create `backend/.env`:**

```env
PORT=8080
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/gasguard
REDIS_URL=redis://localhost:6379
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
CHAIN_ID=114
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
FDC_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000004
GASGUARD_CONTRACT_ADDRESS=
FACTORY_ADDRESS=
PRIVATE_KEY=your_deployer_private_key_here
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=generate_random_string_here
```

**Create `.env` in root:**

```env
VITE_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_CHAIN_ID=114
VITE_GASGUARD_CONTRACT_ADDRESS=
VITE_FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
VITE_FACTORY_ADDRESS=
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

### Step 4: Get Test FLR Tokens

1. Visit [Flare Coston2 Faucet](https://faucet.flare.network/coston2)
2. Enter your wallet address
3. Request test FLR tokens
4. Wait for confirmation (usually instant)

### Step 5: Add Flare Coston2 to MetaMask

**Option A: Manual Addition**

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter:
   - **Network Name**: Flare Coston2 Testnet
   - **RPC URL**: https://coston2-api.flare.network/ext/C/rpc
   - **Chain ID**: 114
   - **Currency Symbol**: FLR
   - **Block Explorer**: https://coston2-explorer.flare.network

**Option B: Chainlist**

1. Visit [Chainlist](https://chainlist.org/chain/114)
2. Click "Add to MetaMask"
3. Approve the network addition

### Step 6: Deploy Smart Contracts

```bash
# Make sure you have test FLR in your deployer account
# Update PRIVATE_KEY in backend/.env with your deployer private key

# Deploy to Coston2
npm run deploy:coston2

# The script will output:
# - PriceVerifier address
# - GasGuard address
# - SmartAccountFactory address
```

**Update `.env` files with deployed addresses:**

```env
# backend/.env
GASGUARD_CONTRACT_ADDRESS=0x...
FACTORY_ADDRESS=0x...

# .env (root)
VITE_GASGUARD_CONTRACT_ADDRESS=0x...
VITE_FACTORY_ADDRESS=0x...
```

### Step 7: Start Services

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**

```bash
npm run dev
```

### Step 8: Access Application

1. Open browser: http://localhost:5173
2. Click "Connect Wallet" button
3. Approve MetaMask connection
4. If not on Coston2, the app will prompt to switch networks

## 🧪 Testing the Integration

### Test FTSOv2 Integration

1. Go to Dashboard
2. Check "FLR Price" card - should show live price from FTSOv2
3. Price should update every 12 seconds (Flare block time)

### Test FDC Integration

1. Go to Chat page
2. Ask: "Should I swap 1000 FLR now?"
3. AI should use FDC historical data for predictions
4. Check console for FDC data fetching

### Test GasGuard Contract

1. Go to GasGuard page
2. Connect wallet
3. Build a transaction
4. Set safety parameters:
   - Max Gas: 30 Gwei
   - Min FLR Price: $0.02
   - Deadline: 24 hours
5. Schedule execution
6. Monitor execution status

## 🔍 Verification Checklist

- [ ] Backend starts without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] Database connection successful
- [ ] Redis connection successful
- [ ] Contracts deployed to Coston2
- [ ] Contract addresses in .env files
- [ ] MetaMask connects successfully
- [ ] Network switches to Coston2 automatically
- [ ] FTSOv2 price displays on dashboard
- [ ] AI chat responds with recommendations
- [ ] GasGuard scheduling works

## 🐛 Troubleshooting

### Backend won't start

- Check PostgreSQL is running: `pg_isready`
- Check Redis is running: `redis-cli ping`
- Verify DATABASE_URL format
- Check all required env variables are set

### Frontend can't connect to backend

- Verify backend is running on port 8080
- Check VITE_API_URL in .env
- Check CORS settings in backend

### MetaMask connection fails

- Ensure MetaMask is installed
- Check browser console for errors
- Try refreshing the page
- Clear browser cache

### Contract deployment fails

- Verify you have test FLR tokens
- Check PRIVATE_KEY is correct
- Verify RPC URL is accessible
- Check network is Coston2 (Chain ID 114)

### FTSOv2 price not showing

- Verify FTSO_CONTRACT_ADDRESS is correct
- Check backend logs for errors
- Verify RPC connection to Coston2
- Check contract is deployed on Coston2

## 📚 Additional Resources

- [Flare Network Docs](https://docs.flare.network/)
- [FTSOv2 Getting Started](https://dev.flare.network/ftso/getting-started)
- [FDC Getting Started](https://dev.flare.network/fdc/getting-started)
- [Coston2 Explorer](https://coston2-explorer.flare.network)
- [Coston2 Faucet](https://faucet.flare.network/coston2)

## 🎉 Next Steps

Once setup is complete:

1. Explore the Dashboard
2. Try the AI Chat interface
3. Schedule a test transaction with GasGuard
4. Compare gas prices across chains
5. Check the Leaderboard

---

**Need Help?** Check the main README.md or open an issue on GitHub.

