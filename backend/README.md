# GasGuard Mentor Backend

Node.js + Express + TypeScript backend API for GasGuard Mentor.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Setup database:
```bash
npx prisma migrate dev
npx prisma generate
```

3. Start development server:
```bash
npm run dev
```

## Environment Variables

See `.env.example` for required environment variables.

## API Endpoints

See [API.md](../docs/API.md) for full API documentation.

## Services

- **AIAgentService**: GPT-4 integration
- **GasOracleService**: Gas price oracle
- **FTSOv2Service**: FTSOv2 price feeds
- **FDCService**: Flare Data Connector
- **AlertService**: Alert management
- **BlockchainMonitor**: Contract event monitoring
- **PredictionEngine**: Gas predictions
- **NotificationService**: Notifications

## Background Jobs

Jobs are automatically started when the server starts. See `src/jobs/` for implementation.

## Database

Uses Prisma ORM with PostgreSQL. Schema is in `prisma/schema.prisma`.

