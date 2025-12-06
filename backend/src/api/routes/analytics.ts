import { Router } from 'express';
import prisma from '../../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

// GET /api/analytics/stats
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        transactions: {
          where: {
            status: 'COMPLETED',
            completedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const totalSaved = Number(user.totalSavedUsd);
    const transactionCount = user.transactions.length;
    const averageSavings =
      transactionCount > 0 ? totalSaved / transactionCount : 0;
    const optimalRate = Number(user.optimalExecutionRate);

    res.json({
      success: true,
      data: {
        totalSaved,
        transactionCount,
        averageSavings,
        optimalRate,
      },
    });
  } catch (error: any) {
    console.error('Analytics stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch analytics',
    });
  }
});

// GET /api/analytics/transactions
router.get('/transactions', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { limit = 50, offset = 0 } = req.query;

    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId },
      orderBy: { scheduledAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
      select: {
        id: true,
        executionId: true,
        status: true,
        transactionType: true,
        actualGasPrice: true,
        actualCostUsd: true,
        savedUsd: true,
        savingsPercentage: true,
        executedAt: true,
        txHash: true,
        blockNumber: true,
      },
    });

    res.json({
      success: true,
      data: transactions.map((tx) => ({
        ...tx,
        actualGasPrice: tx.actualGasPrice ? Number(tx.actualGasPrice) / 1e9 : null, // Convert to Gwei
        actualCostUsd: tx.actualCostUsd ? Number(tx.actualCostUsd) : null,
        savedUsd: tx.savedUsd ? Number(tx.savedUsd) : null,
        savingsPercentage: tx.savingsPercentage ? Number(tx.savingsPercentage) : null,
        blockNumber: tx.blockNumber ? Number(tx.blockNumber) : null,
      })),
    });
  } catch (error: any) {
    console.error('Analytics transactions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transactions',
    });
  }
});

export default router;

