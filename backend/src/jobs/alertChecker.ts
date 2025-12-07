import { Queue, Worker } from 'bullmq';

const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

let alertQueue: Queue | null = null;
let alertCheckerWorker: Worker | null = null;

if (isRedisEnabled()) {
  const redisUrl = process.env.REDIS_URL!;
  alertQueue = new Queue('alert-checker', {
    connection: { url: redisUrl } as any,
  });

  alertCheckerWorker = new Worker(
    'alert-checker',
    async (job) => {
      const AlertService = (await import('../services/AlertService.js')).default;
      try {
        await AlertService.checkAlerts();
        console.log('Alert check completed');
      } catch (error) {
        console.error('Alert checker error:', error);
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

export const startAlertChecker = () => {
  if (!isRedisEnabled() || !alertQueue) {
    console.log('⚠️  Alert checker skipped (Redis disabled)');
    return;
  }

  alertQueue.add(
    'check-alerts',
    {},
    {
      repeat: {
        every: 12000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ Alert checker started');
};

