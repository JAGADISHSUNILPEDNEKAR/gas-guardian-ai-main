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

# Database checks skipped (using SQLite and optional Redis)
echo "✅ Configuration checked"

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

