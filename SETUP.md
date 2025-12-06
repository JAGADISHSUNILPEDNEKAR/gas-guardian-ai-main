# Setup Guide

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL 15+
- Redis 7+
- Docker (optional, recommended)

## Quick Start

### 1. Environment Setup

```bash
# Copy environment templates
cp .env.example .env
cp backend/.env.example backend/.env
```

Edit both files and add:

- `OPENAI_API_KEY` in `backend/.env`
- Other configuration as needed

### 2. Install Dependencies

```bash
# Root
npm install

# Backend
cd backend
npm install
cd ..
```

### 3. Database Setup

**With Docker:**

```bash
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis
```

**Without Docker:**

- Start PostgreSQL on port 5432
- Start Redis on port 6379

Then run migrations:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
cd ..
```

### 4. Deploy Contracts (Optional, for testing)

```bash
# Deploy to local Hardhat network
npx hardhat node  # In one terminal
npx hardhat run scripts/deploy/deployGasGuard.js --network localhost  # In another

# Or deploy to Coston2 testnet
npx hardhat run scripts/deploy/deployGasGuard.js --network coston2
```

Update `.env` with deployed addresses.

### 5. Start Development Servers

```bash
# Backend (terminal 1)
cd backend
npm run dev

# Frontend (terminal 2)
npm run dev
```

Visit http://localhost:5173

## Troubleshooting

### Database Connection Issues

- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check `DATABASE_URL` in `backend/.env`

### Redis Connection Issues

- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `backend/.env`

### OpenAI API Errors

- Verify `OPENAI_API_KEY` is set in `backend/.env`
- Check API key has sufficient credits

### Contract Deployment Failures

- Ensure you have testnet FLR tokens
- Check `PRIVATE_KEY` in `.env` has funds
- Verify RPC URL is correct

