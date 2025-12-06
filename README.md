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

## 🛠️ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

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
```

### 2. Environment Setup

Create `.env` files (see `.env.example` for reference):

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://gasguard:gasguard@localhost:5432/gasguard
REDIS_URL=redis://localhost:6379
FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
FTSO_ADDRESS=0x...
FDC_ADDRESS=0x...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:8080
VITE_FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
```

### 3. Start Services

```bash
# Start PostgreSQL and Redis
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis

# Setup database
cd backend
npx prisma migrate dev
npx prisma generate
cd ..

# Start backend
cd backend
npm run dev

# In another terminal, start frontend
npm run dev
```

Visit `http://localhost:5173` to see the application.

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

### Deploy Contracts

```bash
# Testnet
npx hardhat run scripts/deploy/deployGasGuard.js --network coston2

# Mainnet
npx hardhat run scripts/deploy/deployGasGuard.js --network flare
```

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
