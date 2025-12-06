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

## 🛠️ Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/get-started))
- **PostgreSQL** 15+ (or use Docker)
- **Redis** 7+ (or use Docker)
- **Git** ([Download](https://git-scm.com/))

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd gas-guardian-ai-main
```

### Step 2: Install Dependencies

Install dependencies for both frontend and backend:

```bash
# Install root/frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 3: Environment Configuration

Create environment files for both frontend and backend. If `.env.example` files exist, you can copy them:

```bash
# Copy backend environment example (if exists)
cp backend/.env.example backend/.env

# Copy frontend environment example (if exists)
cp .env.example .env
```

**If `.env.example` files don't exist**, create the `.env` files manually using the templates below.

**Backend Environment** (`backend/.env`):
```env
# Database Configuration
DATABASE_URL=postgresql://gasguard:gasguard@localhost:5432/gasguard

# Redis Configuration
REDIS_URL=redis://localhost:6379

# Flare Network Configuration
FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/bc/C/rpc

# Contract Addresses (deploy contracts first or use existing addresses)
FTSO_ADDRESS=0x0000000000000000000000000000000000000000
FDC_ADDRESS=0x0000000000000000000000000000000000000000

# OpenAI API Key (required for AI chat features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# JWT Secret (generate a random string)
JWT_SECRET=your-random-secret-key-here

# Server Configuration
PORT=8080
NODE_ENV=development
```

**Frontend Environment** (`.env` in root):
```env
# Backend API URL
VITE_API_URL=http://localhost:8080

# Flare Network RPC URL
VITE_FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc

# Contract Addresses (update after deployment)
VITE_FTSO_ADDRESS=0x0000000000000000000000000000000000000000
VITE_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
VITE_GASGUARD_ADDRESS=0x0000000000000000000000000000000000000000
```

**Important Notes:**
- Replace placeholder values with your actual configuration
- Never commit `.env` files to version control
- For production, use secure, randomly generated secrets
- Get your OpenAI API key from [OpenAI Platform](https://platform.openai.com/)

### Step 4: Start Database Services

Using Docker Compose (Recommended):

```bash
# Start PostgreSQL and Redis containers
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis

# Verify services are running
docker-compose -f infra/docker/docker-compose.yml ps
```

**Alternative: Manual Setup**

If you prefer not to use Docker:

1. **PostgreSQL**: Install and start PostgreSQL, then create a database:
   ```bash
   createdb gasguard
   # Or using psql:
   psql -U postgres -c "CREATE DATABASE gasguard;"
   ```

2. **Redis**: Install and start Redis server:
   ```bash
   # macOS
   brew install redis
   brew services start redis
   
   # Linux
   sudo apt-get install redis-server
   sudo systemctl start redis
   ```

### Step 5: Database Setup

Run Prisma migrations to set up the database schema:

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database if seed script exists
# npx prisma db seed

cd ..
```

### Step 6: Start Development Servers

You'll need **two terminal windows**:

**Terminal 1 - Backend Server:**
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:8080`

**Terminal 2 - Frontend Server:**
```bash
# From project root
npm run dev
```

The frontend will start on `http://localhost:5173`

### Step 7: Verify Installation

1. Open your browser and navigate to `http://localhost:5173`
2. Check backend health: `http://localhost:8080/healthz` (if endpoint exists)
3. Verify database connection in backend logs
4. Check Redis connection in backend logs

### Troubleshooting

**Database Connection Issues:**
- Ensure PostgreSQL is running: `docker ps` or `pg_isready`
- Verify `DATABASE_URL` in `backend/.env` matches your setup
- Check database credentials and permissions

**Redis Connection Issues:**
- Ensure Redis is running: `redis-cli ping`
- Verify `REDIS_URL` in `backend/.env` is correct
- Check Redis port (default: 6379) is not blocked

**Port Already in Use:**
- Change `PORT` in `backend/.env` for backend
- Change Vite port in `vite.config.ts` for frontend

**Missing Dependencies:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again in both root and backend directories

**Prisma Issues:**
- Run `npx prisma generate` after schema changes
- Check `backend/prisma/schema.prisma` for syntax errors

### Quick Setup Script

For convenience, you can use the provided setup script:

```bash
# Make the script executable (if needed)
chmod +x start-local.sh

# Run the setup script
./start-local.sh
```

**Note:** The script will check for required services and guide you through the setup process. Make sure to edit the generated `.env` files with your actual configuration values.

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

## 📋 Important Notes

### Files Not Tracked in Git

The following files and directories are excluded from version control (see `.gitignore`):

- `node_modules/` - Dependencies (install with `npm install`)
- `dist/`, `build/` - Build outputs (generated with `npm run build`)
- `.env`, `.env.local` - Environment variables (create from `.env.example`)
- `cache/`, `artifacts/` - Hardhat build artifacts
- `*.log` - Log files
- `bun.lockb` - Bun lock file (if using npm, use `package-lock.json`)

**Before pushing to GitHub:**
- Ensure all `.env` files are excluded
- Never commit API keys, secrets, or private keys
- Build artifacts should be generated, not committed
- Dependencies should be installed via `npm install`, not committed

### Environment Variables

**Required for Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `JWT_SECRET` - Secret for JWT token generation
- `FLARE_RPC_URL` - Flare Network RPC endpoint

**Required for Frontend:**
- `VITE_API_URL` - Backend API URL
- `VITE_FLARE_RPC_URL` - Flare Network RPC endpoint

See the setup section above for complete environment variable configuration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Ensure all tests pass
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 📝 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Flare Network for FTSOv2 and FDC infrastructure
- OpenAI for GPT-4 API
- The open-source community

---

**Built with ❤️ for the Flare Network ecosystem**
