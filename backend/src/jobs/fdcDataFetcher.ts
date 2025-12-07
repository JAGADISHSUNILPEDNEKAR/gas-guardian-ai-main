import { Queue, Worker } from 'bullmq';

const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

let fdcQueue: Queue | null = null;
let fdcDataFetcherWorker: Worker | null = null;

if (isRedisEnabled()) {
  const redisUrl = process.env.REDIS_URL!;
  fdcQueue = new Queue('fdc-data-fetcher', {
    connection: { url: redisUrl } as any,
  });

  fdcDataFetcherWorker = new Worker(
    'fdc-data-fetcher',
    async (job) => {
      const FDCService = (await import('../services/FDCService.js')).default;
      try {
        const history = await FDCService.getHistoricalGasPrices(30);
        const crossChain = await FDCService.getCrossChainGasPrices();
        console.log(`FDC data fetched: ${history.length} historical points, ${Object.keys(crossChain).length} chains`);
      } catch (error) {
        console.error('FDC data fetcher error:', error);
      }
    },
    {
      connection: { url: redisUrl } as any,
    }
  );
}

export const startFDCDataFetcher = () => {
  if (!isRedisEnabled() || !fdcQueue) {
    console.log('⚠️  FDC data fetcher skipped (Redis disabled)');
    return;
  }

  fdcQueue.add(
    'fetch-fdc-data',
    {},
    {
      repeat: {
        every: 3600000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ FDC data fetcher started');
};

