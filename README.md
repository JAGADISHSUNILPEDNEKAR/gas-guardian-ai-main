# GasGuard Mentor - AI-Powered Gas Optimization Platform

> **Never overpay for gas again.** GasGuard Mentor combines AI-driven gas prediction with on-chain safety enforcement using Flare Network's FTSOv2 oracles and FDC.

## 🚀 Features

- **AI Chat Interface**: GPT-4 powered recommendations for optimal gas timing
- **Real-Time Gas Dashboard**: Live gas prices, network congestion, and predictions
- **GasGuard Smart Contract**: On-chain protection that only executes when conditions are met
- **Multi-Chain Comparison**: Compare deployment costs across 5+ chains
- **Alert System**: Notifications when gas drops to target prices
- **Leaderboard**: Track and compare gas savings with other users

## 🏗️ Architecture

```
┌─────────────┐
│   Frontend  │ React + Vite + Tailwind
│  (Port 5173)│
└──────┬──────┘
       │
┌──────▼──────┐
│   Backend   │ Node.js + Express + TypeScript
│  (Port 8080)│
└──────┬──────┘
       │
┌──────▼──────────────────┐
│  PostgreSQL + Redis     │
└─────────────────────────┘
       │
┌──────▼──────────────────┐
│  Flare Network          │
│  - FTSOv2 (Price Feeds)  │
│  - FDC (Historical Data) │
│  - GasGuard Contracts   │
└─────────────────────────┘
```

## 📁 Project Structure

```
gas-guardian-ai-main/
├── frontend/              # React + Vite application
│   └── src/
│       ├── components/   # UI components
│       ├── hooks/        # Custom React hooks
│       └── pages/         # Page components
├── backend/              # Node.js API server
│   ├── src/
│   │   ├── api/          # Express routes
│   │   ├── services/     # Business logic
│   │   ├── jobs/         # Background workers
│   │   └── config/       # Configuration
│   └── prisma/           # Database schema
├── contracts/            # Solidity smart contracts
│   ├── core/             # Main contracts
│   ├── interfaces/       # Contract interfaces
│   └── test/             # Contract tests
├── infra/                # Infrastructure
│   └── docker/           # Docker configs
├── scripts/               # Deployment scripts
└── docs/                  # Documentation
```

## 🏆 Flare Integrations (Hackathon Criteria)

✅ **FTSOv2**: Real-time decentralized price feeds for FLR/USD verification  
✅ **FDC**: Historical gas patterns and cross-chain data for AI predictions  
✅ **Smart Accounts**: Transaction batching and scheduling  

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- MetaMask wallet
- Flare Coston2 testnet FLR (get from [faucet](https://faucet.flare.network/coston2))

### 1. Clone and Install

```bash
git clone <repository-url>
cd gas-guardian-ai-main

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Install Hardhat for contracts
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
```

### 2. Environment Setup

**Frontend (.env):**
```env
VITE_FLARE_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
VITE_CHAIN_ID=114
VITE_GASGUARD_CONTRACT_ADDRESS=<deployed_address>
VITE_FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
VITE_FACTORY_ADDRESS=<deployed_address>
VITE_API_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080
```

**Backend (backend/.env):**
```env
PORT=8080
DATABASE_URL=postgresql://user:password@localhost:5432/gasguard
REDIS_URL=redis://localhost:6379
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
CHAIN_ID=114
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
FDC_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000004
GASGUARD_CONTRACT_ADDRESS=<deployed_address>
PRIVATE_KEY=<your_deployer_private_key>
OPENAI_API_KEY=<your_openai_key>
JWT_SECRET=<random_secret>
```

**Important Contract Addresses:**
- FTSOv2 Feed Publisher: `0x1000000000000000000000000000000000000003`
- FDC Connector: `0x1000000000000000000000000000000000000004`
- Reference: [FTSOv2 Docs](https://dev.flare.network/ftso/getting-started) | [FDC Docs](https://dev.flare.network/fdc/getting-started)

### 3. Setup Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
cd ..
```

### 4. Deploy Contracts to Flare Coston2

```bash
# Get test FLR from faucet: https://faucet.flare.network/coston2
# Add Coston2 to MetaMask: Chain ID 114, RPC: https://coston2-api.flare.network/ext/C/rpc

# Deploy contracts
npm run deploy:coston2

# Update .env files with deployed contract addresses
```

### 5. Start Services

```bash
# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
npm run dev
```

Visit `http://localhost:5173`

### 6. Connect Wallet

1. Install MetaMask browser extension
2. Add Flare Coston2 network:
   - Chain ID: 114
   - RPC URL: https://coston2-api.flare.network/ext/C/rpc
   - Currency: FLR
   - Explorer: https://coston2-explorer.flare.network
3. Get test FLR from [faucet](https://faucet.flare.network/coston2)
4. Connect wallet in the app

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Architecture Overview](./docs/ARCHITECTURE.md) (coming soon)

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Contract Tests
```bash
npx hardhat test
```

## 🐳 Docker Deployment

```bash
# Start all services
docker-compose -f infra/docker/docker-compose.yml up -d

# View logs
docker-compose -f infra/docker/docker-compose.yml logs -f

# Stop services
docker-compose -f infra/docker/docker-compose.yml down
```

## 🔧 Development

### Backend Services
- **AIAgentService**: GPT-4 integration for recommendations
- **GasOracleService**: Real-time gas price fetching
- **FTSOv2Service**: FTSOv2 price feed integration
- **FDCService**: Historical and cross-chain data
- **AlertService**: Alert management and checking
- **BlockchainMonitor**: Smart contract event monitoring
- **PredictionEngine**: Gas price forecasting
- **NotificationService**: Multi-channel notifications

### Background Jobs
- `gasPricePoller`: Polls gas prices every 12 seconds
- `alertChecker`: Checks alert conditions every block
- `leaderboardUpdater`: Updates leaderboard every 5 minutes
- `fdcDataFetcher`: Fetches FDC data hourly
- `modelTrainer`: Trains prediction model daily

### Smart Contracts
- **GasGuard.sol**: Core safety execution contract
- **PriceVerifier.sol**: FTSOv2 price verification
- **SmartAccount.sol**: Account abstraction
- **SmartAccountFactory.sol**: Factory for creating accounts

## 🚢 Deployment

### Production Build

```bash
# Frontend
npm run build

# Backend
cd backend
npm run build
```

### Deploy Contracts to Flare Coston2

```bash
# Make sure you have test FLR in your deployer account
# Get from: https://faucet.flare.network/coston2

# Deploy to Coston2 testnet
npm run deploy:coston2

# The script will output contract addresses - update your .env files
# Verify contracts on: https://coston2-explorer.flare.network
```

**Contract Deployment Order:**
1. PriceVerifier (uses FTSOv2)
2. GasGuard (uses PriceVerifier)
3. SmartAccountFactory

## 📊 API Endpoints

- `POST /api/chat` - AI chat interface
- `GET /api/gas/current` - Current gas data
- `GET /api/gas/predictions` - Gas predictions
- `POST /api/transactions/schedule` - Schedule execution
- `GET /api/transactions/:id` - Transaction status
- `POST /api/alerts` - Create alert
- `GET /api/leaderboard` - Leaderboard
- `POST /api/compare/deployment` - Compare chains

See [API.md](./docs/API.md) for detailed documentation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Flare Network for FTSOv2 and FDC infrastructure
- OpenAI for GPT-4 API
- The open-source community

---

**Built with ❤️ for the Flare Network ecosystem**
