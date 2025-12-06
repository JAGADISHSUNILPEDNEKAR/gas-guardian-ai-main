import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import prisma from '../config/database.js';

const leaderboardQueue = new Queue('leaderboard-updater', {
  connection: process.env.REDIS_URL || 'redis://localhost:6379',
});

export const leaderboardUpdaterWorker = new Worker(
  'leaderboard-updater',
  async (job) => {
    try {
      // Get top 100 users by savings
      const users = await prisma.user.findMany({
        orderBy: {
          totalSavedUsd: 'desc',
        },
        take: 100,
        select: {
          id: true,
          totalSavedUsd: true,
          transactionCount: true,
        },
      });

      // Update leaderboard table
      for (let i = 0; i < users.length; i++) {
        await prisma.leaderboard.upsert({
          where: { userId: users[i].id },
          update: {
            rank: i + 1,
            totalSaved: users[i].totalSavedUsd,
            transactionCount: users[i].transactionCount,
          },
          create: {
            userId: users[i].id,
            rank: i + 1,
            totalSaved: users[i].totalSavedUsd,
            transactionCount: users[i].transactionCount,
          },
        });
      }

      // Invalidate cache
      await redisClient.del('leaderboard:global');
      await redisClient.del('leaderboard:month');
      await redisClient.del('leaderboard:all');

      console.log('Leaderboard updated');
    } catch (error) {
      console.error('Leaderboard updater error:', error);
      throw error;
    }
  },
  {
    connection: process.env.REDIS_URL || 'redis://localhost:6379',
  }
);

// Schedule recurring job (every 5 minutes)
export const startLeaderboardUpdater = () => {
  leaderboardQueue.add(
    'update-leaderboard',
    {},
    {
      repeat: {
        every: 300000, // 5 minutes
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('Leaderboard updater started');
};

