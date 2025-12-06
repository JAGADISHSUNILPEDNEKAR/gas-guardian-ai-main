import { ethers } from 'ethers';
import { getProvider } from '../config/blockchain.js';
import prisma from '../config/database.js';
import redisClient from '../config/redis.js';

// GasGuard Contract ABI (simplified)
const GASGUARD_ABI = [
  'event ExecutionScheduled(bytes32 indexed executionId, address indexed user, uint256 deadline)',
  'event SafeExecutionCompleted(bytes32 indexed executionId, address indexed user, uint256 gasUsed, uint256 flrPrice, uint256 savingsUSD)',
  'event SafetyCheckFailed(bytes32 indexed executionId, string reason, uint256 currentValue, uint256 targetValue)',
  'event RefundIssued(bytes32 indexed executionId, address indexed user, uint256 amount)',
];

export class BlockchainMonitor {
  private provider = getProvider('flare');
  private contract: ethers.Contract | null = null;
  private isMonitoring = false;

  constructor() {
    const gasGuardAddress = process.env.GASGUARD_ADDRESS;
    if (gasGuardAddress && gasGuardAddress !== '0x0000000000000000000000000000000000000000') {
      this.contract = new ethers.Contract(gasGuardAddress, GASGUARD_ABI, this.provider);
    }
  }

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring || !this.contract) {
      return;
    }

    this.isMonitoring = true;
    console.log('Starting blockchain monitoring...');

    // Listen to all events
    this.contract.on('ExecutionScheduled', async (executionId, user, deadline, event) => {
      await this.handleExecutionScheduled(executionId, user, deadline, event);
    });

    this.contract.on('SafeExecutionCompleted', async (executionId, user, gasUsed, flrPrice, savingsUSD, event) => {
      await this.handleSafeExecutionCompleted(executionId, user, gasUsed, flrPrice, savingsUSD, event);
    });

    this.contract.on('SafetyCheckFailed', async (executionId, reason, currentValue, targetValue, event) => {
      await this.handleSafetyCheckFailed(executionId, reason, currentValue, targetValue, event);
    });

    this.contract.on('RefundIssued', async (executionId, user, amount, event) => {
      await this.handleRefundIssued(executionId, user, amount, event);
    });
  }

  stopMonitoring(): void {
    if (this.contract) {
      this.contract.removeAllListeners();
    }
    this.isMonitoring = false;
    console.log('Stopped blockchain monitoring');
  }

  private async handleExecutionScheduled(
    executionId: string,
    user: string,
    deadline: bigint,
    event: any
  ): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { executionId },
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'MONITORING',
            scheduledAt: new Date(),
          },
        });
      }

      // Invalidate leaderboard cache
      await redisClient.del('leaderboard:global');
    } catch (error) {
      console.error('Error handling ExecutionScheduled:', error);
    }
  }

  private async handleSafeExecutionCompleted(
    executionId: string,
    user: string,
    gasUsed: bigint,
    flrPrice: bigint,
    savingsUSD: bigint,
    event: any
  ): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { executionId },
        include: { user: true },
      });

      if (transaction) {
        const savings = Number(savingsUSD) / 1e6; // Assuming 6 decimals for USD

        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date(event.blockNumber ? await this.provider.getBlock(event.blockNumber).then(b => new Date(b.timestamp * 1000)) : new Date()),
            completedAt: new Date(),
            actualGasPrice: Number(gasUsed),
            actualFlrPrice: Number(flrPrice) / 1e8, // Assuming 8 decimals
            savedUsd: savings,
            txHash: event.transactionHash,
            blockNumber: event.blockNumber ? Number(event.blockNumber) : null,
          },
        });

        // Update user savings
        if (transaction.user) {
          await prisma.user.update({
            where: { id: transaction.userId },
            data: {
              totalSavedUsd: { increment: savings },
              transactionCount: { increment: 1 },
            },
          });
        }
      }

      // Invalidate leaderboard cache
      await redisClient.del('leaderboard:global');
    } catch (error) {
      console.error('Error handling SafeExecutionCompleted:', error);
    }
  }

  private async handleSafetyCheckFailed(
    executionId: string,
    reason: string,
    currentValue: bigint,
    targetValue: bigint,
    event: any
  ): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { executionId },
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            // Store failure reason in a JSON field if needed
          },
        });
      }
    } catch (error) {
      console.error('Error handling SafetyCheckFailed:', error);
    }
  }

  private async handleRefundIssued(
    executionId: string,
    user: string,
    amount: bigint,
    event: any
  ): Promise<void> {
    try {
      const transaction = await prisma.transaction.findUnique({
        where: { executionId },
      });

      if (transaction) {
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'REFUNDED',
            completedAt: new Date(),
            txHash: event.transactionHash,
          },
        });
      }
    } catch (error) {
      console.error('Error handling RefundIssued:', error);
    }
  }
}

export default new BlockchainMonitor();

