#!/bin/bash

# GasGuard Mentor - Local Development Startup Script

echo "🚀 Starting GasGuard Mentor locally..."

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating backend/.env from example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env and add your configuration values"
fi

if [ ! -f .env ]; then
    echo "📝 Creating .env from example..."
    cat > .env << EOF
VITE_API_URL=http://localhost:8080
VITE_FLARE_RPC_URL=https://flare-api.flare.network/ext/bc/C/rpc
VITE_FTSO_ADDRESS=0x0000000000000000000000000000000000000000
VITE_FACTORY_ADDRESS=0x0000000000000000000000000000000000000000
VITE_GASGUARD_ADDRESS=0x0000000000000000000000000000000000000000
EOF
fi

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "⚠️  PostgreSQL is not running on localhost:5432"
    echo "   Please start PostgreSQL or use Docker:"
    echo "   docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=gasguard -e POSTGRES_DB=gasguard postgres:15-alpine"
    exit 1
fi

# Check if Redis is running
if ! redis-cli ping > /dev/null 2>&1; then
    echo "⚠️  Redis is not running on localhost:6379"
    echo "   Please start Redis or use Docker:"
    echo "   docker run -d --name redis -p 6379:6379 redis:7-alpine"
    exit 1
fi

echo "✅ PostgreSQL and Redis are running"

# Setup database
echo "📦 Setting up database..."
cd backend
if [ ! -d node_modules ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Running database migrations..."
npx prisma generate
npx prisma migrate dev --name init || echo "Migrations may already exist"

cd ..

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "🎨 Starting frontend..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ GasGuard Mentor is starting!"
echo ""
echo "📊 Backend: http://localhost:8080"
echo "🎨 Frontend: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for user interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait

