import { Router } from 'express';
import prisma from '../../config/database.js';
import redisClient from '../../config/redis.js';

const router = Router();

// GET /api/leaderboard
router.get('/', async (req, res) => {
  try {
    const { limit = 100, timeframe = 'all' } = req.query;

    const cacheKey = `leaderboard:${timeframe}:${limit}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      res.json({
        success: true,
        data: JSON.parse(cached),
      });
      return;
    }

    let whereClause: any = {};
    if (timeframe === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      whereClause = {
        transactions: {
          some: {
            completedAt: {
              gte: oneMonthAgo,
            },
          },
        },
      };
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      orderBy: {
        totalSavedUsd: 'desc',
      },
      take: Number(limit),
      select: {
        id: true,
        walletAddress: true,
        totalSavedUsd: true,
        transactionCount: true,
        optimalExecutionRate: true,
      },
    });

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      walletAddress: user.walletAddress,
      totalSaved: user.totalSavedUsd,
      transactionCount: user.transactionCount,
      optimalRate: user.optimalExecutionRate,
    }));

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(leaderboard));

    res.json({
      success: true,
      data: leaderboard,
    });
  } catch (error: any) {
    console.error('Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch leaderboard',
    });
  }
});

export default router;

