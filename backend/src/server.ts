import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './api/routes/chat.js';
import gasRoutes from './api/routes/gas.js';
import transactionRoutes from './api/routes/transactions.js';
import alertRoutes from './api/routes/alerts.js';
import leaderboardRoutes from './api/routes/leaderboard.js';
import compareRoutes from './api/routes/compare.js';
import analyticsRoutes from './api/routes/analytics.js';
import { errorHandler } from './api/middleware/errorHandler.js';
import { rateLimit } from './api/middleware/rateLimit.js';
import BlockchainMonitor from './services/BlockchainMonitor.js';
import { startAllJobs } from './jobs/index.js';
import http from 'http';
import WebSocketManager from './api/websocket.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(rateLimit(100, 60000)); // 100 requests per minute

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/gas', gasRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/compare', compareRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handler
app.use(errorHandler);

// Initialize WebSocket
WebSocketManager.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}/ws`);

  // Start blockchain monitoring
  BlockchainMonitor.startMonitoring().catch(console.error);

  // Start background jobs
  startAllJobs();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  BlockchainMonitor.stopMonitoring();
  WebSocketManager.close();
  server.close(() => {
    process.exit(0);
  });
});

export default app;

