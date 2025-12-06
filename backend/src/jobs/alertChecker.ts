import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import AlertService from '../services/AlertService.js';

const alertQueue = new Queue('alert-checker', {
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const alertCheckerWorker = new Worker(
  'alert-checker',
  async (job) => {
    const alertService = new AlertService();
    
    try {
      await alertService.checkAlerts();
      console.log('Alert check completed');
    } catch (error) {
      console.error('Alert checker error:', error);
      throw error;
    }
  },
  {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
    limiter: {
      max: 1,
      duration: 12000, // Every block (12 seconds)
    },
  }
);

// Schedule recurring job
export const startAlertChecker = () => {
  alertQueue.add(
    'check-alerts',
    {},
    {
      repeat: {
        every: 12000, // Every block
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('Alert checker started');
};

