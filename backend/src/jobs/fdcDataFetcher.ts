import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import FDCService from '../services/FDCService.js';

const fdcQueue = new Queue('fdc-data-fetcher', {
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const fdcDataFetcherWorker = new Worker(
  'fdc-data-fetcher',
  async (job) => {
    const fdcService = new FDCService();
    
    try {
      // Fetch historical gas patterns (30 days)
      const history = await fdcService.getHistoricalGasPrices(30);
      
      // Fetch cross-chain gas prices
      const crossChain = await fdcService.getCrossChainGasPrices();
      
      console.log(`FDC data fetched: ${history.length} historical points, ${Object.keys(crossChain).length} chains`);
    } catch (error) {
      console.error('FDC data fetcher error:', error);
      // Don't throw - FDC might be unavailable
    }
  },
  {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
  }
);

// Schedule recurring job (hourly)
export const startFDCDataFetcher = () => {
  fdcQueue.add(
    'fetch-fdc-data',
    {},
    {
      repeat: {
        every: 3600000, // 1 hour
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('FDC data fetcher started');
};

