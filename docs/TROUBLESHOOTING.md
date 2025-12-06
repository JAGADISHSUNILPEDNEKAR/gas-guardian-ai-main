# Troubleshooting Guide

## Common Issues

### 1. "Cannot connect to database"

**Symptoms:** Backend crashes with database connection errors

**Solutions:**

- Ensure PostgreSQL is running: `pg_isready -h localhost -p 5432`
- Check `DATABASE_URL` format in `backend/.env`
- Verify credentials: `psql -U gasguard -d gasguard -h localhost`
- Run migrations: `cd backend && npx prisma migrate dev`

### 2. "Redis connection failed"

**Symptoms:** Backend starts but features don't work

**Solutions:**

- Ensure Redis is running: `redis-cli ping`
- Check `REDIS_URL` in `backend/.env`
- Restart Redis: `docker restart gasguard-redis` or `sudo systemctl restart redis`

### 3. "OpenAI API key invalid"

**Symptoms:** Chat returns 500 errors

**Solutions:**

- Verify `OPENAI_API_KEY` is set in `backend/.env`
- Check key format starts with `sk-`
- Verify key has credits: https://platform.openai.com/usage
- Test key: `curl https://api.openai.com/v1/models -H "Authorization: Bearer YOUR_KEY"`

### 4. "Transaction scheduling fails"

**Symptoms:** GasGuard returns errors when scheduling

**Solutions:**

- Deploy contracts first: `npm run deploy:coston2`
- Update contract addresses in `.env`
- Ensure wallet is connected
- Check you have testnet tokens

### 5. "Port already in use"

**Symptoms:** `EADDRINUSE: address already in use`

**Solutions:**

```bash
# Find process using port
lsof -i :8080  # or :5173 for frontend

# Kill process
kill -9 <PID>

# Or use different port
PORT=8081 npm run dev
```

### 6. "Module not found" errors

**Symptoms:** Import errors in TypeScript

**Solutions:**

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npx prisma generate
```

## Still Having Issues?

1. Check logs:

   - Backend: Check console output
   - Frontend: Check browser console (F12)
   - Docker: `docker logs gasguard-backend`

2. Verify environment:

   - Node version: `node -v` (should be 18+)
   - npm version: `npm -v`
   - Database connection: `psql -U gasguard -d gasguard -h localhost`

3. Try clean start:

```bash
# Stop everything
docker-compose -f infra/docker/docker-compose.yml down
pkill -f "npm run dev"

# Clean
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install

# Restart
docker-compose -f infra/docker/docker-compose.yml up -d postgres redis
cd backend && npm run dev
```

