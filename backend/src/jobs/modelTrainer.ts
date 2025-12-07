import { Queue, Worker } from 'bullmq';
import PredictionEngine from '../services/PredictionEngine.js';

const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

let modelQueue: Queue | null = null;
let modelTrainerWorker: Worker | null = null;

if (isRedisEnabled()) {
  const redisUrl = process.env.REDIS_URL!;
  modelQueue = new Queue('model-trainer', {
    connection: { url: redisUrl } as any,
  });

  modelTrainerWorker = new Worker(
    'model-trainer',
    async (job) => {
      const PredictionEngine = (await import('../services/PredictionEngine.js')).default;
      try {
        await PredictionEngine.trainModel();
        console.log('Prediction model trained');
      } catch (error) {
        console.error('Model trainer error:', error);
        throw error;
      }
    },
    {
      connection: { url: redisUrl } as any,
    }
  );
}

export const startModelTrainer = () => {
  if (!isRedisEnabled() || !modelQueue) {
    console.log('⚠️  Model trainer skipped (Redis disabled)');
    return;
  }

  modelQueue.add(
    'train-model',
    {},
    {
      repeat: {
        pattern: '0 2 * * *', // Daily at 2 AM UTC
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ Model trainer started');
};

