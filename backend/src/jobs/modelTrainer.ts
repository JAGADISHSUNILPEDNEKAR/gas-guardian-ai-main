import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import PredictionEngine from '../services/PredictionEngine.js';

const modelQueue = new Queue('model-trainer', {
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const modelTrainerWorker = new Worker(
  'model-trainer',
  async (job) => {
    const predictionEngine = new PredictionEngine();
    
    try {
      await predictionEngine.trainModel();
      console.log('Prediction model trained');
    } catch (error) {
      console.error('Model trainer error:', error);
      throw error;
    }
  },
  {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
  }
);

// Schedule recurring job (daily at 2 AM UTC)
export const startModelTrainer = () => {
  modelQueue.add(
    'train-model',
    {},
    {
      repeat: {
        cron: '0 2 * * *', // Daily at 2 AM UTC
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('Model trainer started');
};

