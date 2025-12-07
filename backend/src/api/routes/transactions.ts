import { Router } from 'express';
import { ethers } from 'ethers';
import { getProvider } from '../../config/blockchain.js';
import prisma from '../../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import GasOracleService from '../../services/GasOracleService.js';
import FTSOv2Service from '../../services/FTSOv2Service.js';

const router = Router();

// POST /api/transactions/schedule
router.post('/schedule', authenticate, async (req: AuthRequest, res) => {
  try {
    const { transaction, safetyParams } = req.body;
    const walletAddress = req.walletAddress || transaction?.walletAddress;

    if (!walletAddress) {
      res.status(400).json({ success: false, error: 'Wallet address required' });
      return;
    }

    // Get or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
          notificationPreferences: JSON.stringify({ browser: true }),
        },
      });
    }

    // Calculate immediate cost for savings comparison
    const gasOracle = GasOracleService;
    const ftsoService = FTSOv2Service;
    const currentGas = await gasOracle.getCurrentGas();
    const flrPrice = await ftsoService.getPrice('FLR/USD');
    const immediateCost = currentGas.gwei * 0.000000001 * 21000 * flrPrice.price;

    // Create transaction record
    const dbTransaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        executionId: ethers.keccak256(ethers.toUtf8Bytes(`${walletAddress}-${Date.now()}`)),
        status: 'SCHEDULED',
        transactionType: transaction?.type || 'CUSTOM',
        maxGasPrice: safetyParams.maxGasPrice * 1e9, // Convert to wei
        minAssetPrice: safetyParams.minFlrPrice ? Math.floor(safetyParams.minFlrPrice * 1e8) : null,
        maxSlippage: safetyParams.maxSlippage || null,
        deadline: new Date(safetyParams.deadline * 1000),
        targetAddress: transaction.target,
        transactionData: transaction.data,
        value: transaction.value || '0',
        immediateCostUsd: immediateCost,
      },
    });

    // Estimate savings
    const estimatedSavings = immediateCost * 0.5; // Placeholder

    res.json({
      success: true,
      data: {
        executionId: dbTransaction.executionId,
        status: dbTransaction.status,
        estimatedExecution: safetyParams.deadline
          ? new Date(safetyParams.deadline * 1000).toISOString()
          : null,
        estimatedSavings: {
          amount: estimatedSavings,
          percentage: 50,
        },
        monitoringUrl: `/api/transactions/${dbTransaction.executionId}`,
      },
    });
  } catch (error: any) {
    console.error('Schedule transaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to schedule transaction',
    });
  }
});

// GET /api/transactions/:id
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const transaction = await prisma.transaction.findUnique({
      where: { executionId: id },
      include: { user: true },
    });

    if (!transaction) {
      res.status(404).json({ success: false, error: 'Transaction not found' });
      return;
    }

    // Check authorization
    // We compare with walletAddress because req.userId might be the wallet address itself (from auth middleware)
    // while transaction.userId is the internal UUID
    if (transaction.user.walletAddress.toLowerCase() !== req.walletAddress?.toLowerCase()) {
      res.status(403).json({ success: false, error: 'Unauthorized' });
      return;
    }

    res.json({
      success: true,
      data: transaction,
    });
  } catch (error: any) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch transaction',
    });
  }
});

export default router;

