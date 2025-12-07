# SQLite Setup Guide

## ✅ SQLite Use Karne Ke Liye

SQLite use karne se PostgreSQL install karne ki zarurat nahi! Yeh bahut easier hai.

## Steps

### 1. `.env` File Create Karein

Backend folder me `.env` file me yeh add karein:

```env
PORT=8080
NODE_ENV=development
DATABASE_URL="file:./dev.db"
REDIS_URL=redis://localhost:6379
COSTON2_RPC_URL=https://coston2-api.flare.network/ext/C/rpc
CHAIN_ID=114
FTSO_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000003
FDC_CONTRACT_ADDRESS=0x1000000000000000000000000000000000000004
GASGUARD_CONTRACT_ADDRESS=
FACTORY_ADDRESS=
PRIVATE_KEY=
OPENAI_API_KEY=
JWT_SECRET=your_random_secret_here
```

**Important**: `DATABASE_URL="file:./dev.db"` - yeh SQLite file path hai.

### 2. Migrate Run Karein

```bash
cd backend
npx prisma migrate dev --name init
```

Yeh automatically `dev.db` file create kar dega backend folder me.

### 3. Prisma Client Generate Karein

```bash
npx prisma generate
```

### 4. Done! 🎉

Ab backend start kar sakte ho:

```bash
npm run dev
```

## SQLite vs PostgreSQL

**SQLite Advantages:**
- ✅ No installation needed
- ✅ File-based database (easy backup)
- ✅ Perfect for development
- ✅ No server required

**Note**: Production me PostgreSQL better hai, but development/testing ke liye SQLite perfect hai!

## Database File Location

SQLite database file: `backend/dev.db`

Agar database reset karna ho:

```bash
# Delete database file
rm dev.db

# Recreate
npx prisma migrate dev
```

---

**Ab PostgreSQL ki zarurat nahi!** 🚀

