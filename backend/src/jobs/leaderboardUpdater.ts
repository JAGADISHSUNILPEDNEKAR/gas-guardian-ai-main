import { Queue, Worker } from 'bullmq';
import redisClient from '../config/redis.js';
import prisma from '../config/database.js';

const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

let leaderboardQueue: Queue | null = null;
let leaderboardUpdaterWorker: Worker | null = null;

if (isRedisEnabled()) {
  const redisUrl = process.env.REDIS_URL!;
  leaderboardQueue = new Queue('leaderboard-updater', {
    connection: { url: redisUrl } as any,
  });

  leaderboardUpdaterWorker = new Worker(
    'leaderboard-updater',
    async (job) => {
      try {
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
      connection: { url: redisUrl } as any,
    }
  );
}

export const startLeaderboardUpdater = () => {
  if (!isRedisEnabled() || !leaderboardQueue) {
    console.log('⚠️  Leaderboard updater skipped (Redis disabled)');
    return;
  }

  leaderboardQueue.add(
    'update-leaderboard',
    {},
    {
      repeat: {
        every: 300000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    }
  );

  console.log('✅ Leaderboard updater started');
};

