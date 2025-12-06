import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import GasOracleService from '../services/GasOracleService.js';

const gasPriceQueue = new Queue('gas-price-poller', {
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

// Poll every 12 seconds (Flare block time)
export const gasPricePollerWorker = new Worker(
  'gas-price-poller',
  async (job) => {
    const gasOracle = new GasOracleService();
    
    try {
      // Fetch and store current gas price
      const currentGas = await gasOracle.getCurrentGas();
      
      // Check for scheduled transactions that might be ready
      // This would trigger execution checks in the GasGuard contract
      
      console.log(`Gas price polled: ${currentGas.gwei} Gwei`);
    } catch (error) {
      console.error('Gas price poller error:', error);
      throw error;
    }
  },
  {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
    limiter: {
      max: 1,
      duration: 12000, // 12 seconds
    },
  }
);

// Schedule recurring job
export const startGasPricePoller = () => {
  gasPriceQueue.add(
    'poll-gas-price',
    {},
    {
      repeat: {
        every: 12000, // 12 seconds
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('Gas price poller started');
};

