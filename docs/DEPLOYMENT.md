# Deployment Guide

## Prerequisites
- Node.js 18+
- Docker and Docker Compose
- PostgreSQL 15+
- Redis 7+

## Local Development Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd gas-guardian-ai-main
```

### 2. Environment Variables
Create `.env` files:

**Backend (.env in backend/):**
```env
DATABASE_URL=postgresql://gasguard:gasguard@localhost:5432/gasguard
REDIS_URL=redis://localhost:6379
FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
FTSO_ADDRESS=0x...
FDC_ADDRESS=0x...
OPENAI_API_KEY=sk-...
JWT_SECRET=your-secret-key
```

**Frontend (.env in root):**
```env
VITE_API_URL=http://localhost:8080
VITE_FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
```

### 3. Start Services with Docker
```bash
docker-compose -f infra/docker/docker-compose.yml up -d
```

### 4. Database Setup
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

### 5. Start Backend
```bash
cd backend
npm run dev
```

### 6. Start Frontend
```bash
npm install
npm run dev
```

## Production Deployment

### Backend Deployment
1. Build Docker image:
```bash
docker build -f infra/docker/Dockerfile.backend -t gasguard-backend .
```

2. Run with environment variables:
```bash
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=... \
  -e REDIS_URL=... \
  --name gasguard-backend \
  gasguard-backend
```

### Frontend Deployment
1. Build:
```bash
npm run build
```

2. Deploy `dist/` folder to Vercel, Netlify, or similar.

## Smart Contract Deployment

### Deploy to Coston2 Testnet
```bash
npx hardhat run scripts/deploy/deployGasGuard.js --network coston2
```

### Deploy to Flare Mainnet
```bash
npx hardhat run scripts/deploy/deployGasGuard.js --network flare
```

## Monitoring
- Health check: `GET /healthz`
- Metrics: `GET /metrics`

