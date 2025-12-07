import { Queue, Worker } from 'bullmq';
import GasOracleService from '../services/GasOracleService.js';

// Check if Redis is enabled
const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

let gasPriceQueue: Queue | null = null;
let gasPricePollerWorker: Worker | null = null;

// Only initialize if Redis is enabled
if (isRedisEnabled()) {
  const redisUrl = process.env.REDIS_URL!;
  gasPriceQueue = new Queue('gas-price-poller', {
    connection: { url: redisUrl } as any,
  });

  gasPricePollerWorker = new Worker(
    'gas-price-poller',
    async (job) => {
      try {
        const currentGas = await GasOracleService.getCurrentGas();
        console.log(`Gas price polled: ${currentGas.gwei} Gwei`);
      } catch (error) {
        console.error('Gas price poller error:', error);
        throw error;
      }
    },
    {
      connection: { url: redisUrl } as any,
      limiter: {
        max: 1,
        duration: 12000,
      },
    }
  );
}

// Schedule recurring job
export const startGasPricePoller = () => {
  if (!isRedisEnabled() || !gasPriceQueue) {
    console.log('⚠️  Gas price poller skipped (Redis disabled)');
    return;
  }

  gasPriceQueue.add(
    'poll-gas-price',
    {},
    {
      repeat: {
        every: 12000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ Gas price poller started');
};

