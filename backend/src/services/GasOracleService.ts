import { ethers } from 'ethers';
import { getProvider } from '../config/blockchain.js';
import redisClient from '../config/redis.js';
import prisma from '../config/database.js';

interface GasPrice {
  gwei: number;
  wei: string;
  timestamp: number;
}

export class GasOracleService {
  private provider = getProvider('flare');
  private cacheTTL = 12; // seconds (1 Flare block)

  async getCurrentGas(): Promise<GasPrice> {
    const cacheKey = 'gas:current';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || feeData.maxFeePerGas || BigInt(0);
      const gwei = Number(gasPrice) / 1e9;

      const result: GasPrice = {
        gwei: Math.round(gwei * 100) / 100,
        wei: gasPrice.toString(),
        timestamp: Date.now(),
      };

      // Cache
      await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(result));

      // Store in database (async, don't wait)
      this.storeGasHistory(result).catch(console.error);

      return result;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      throw new Error('Failed to fetch gas price');
    }
  }

  async getGasByPercentile(percentile: number): Promise<number> {
    // Get last 24 hours of gas history
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const history = await prisma.gasHistory.findMany({
        where: {
          timestamp: {
            gte: oneDayAgo,
          },
        },
        orderBy: {
          gasPrice: 'asc',
        },
      });

      if (history.length === 0) {
        const current = await this.getCurrentGas();
        return current.gwei;
      }

      const index = Math.floor((history.length * percentile) / 100);
      const val = history[index]?.gasPrice;
      return val ? (typeof val === 'number' ? val : val.toNumber()) : 0;
    } catch (error) {
      console.error('Error fetching gas history (DB might be down):', error);
      return 50; // Fallback to safe default (medium congestion assumption)
    }
  }

  async estimateImmediateCost(gasUnits: number, gasPriceGwei: number): Promise<number> {
    const costWei = BigInt(gasUnits) * BigInt(Math.floor(gasPriceGwei * 1e9));
    return Number(costWei) / 1e18; // Convert to FLR
  }

  async getCongestionLevel(): Promise<number> {
    const current = await this.getCurrentGas();
    const p95 = await this.getGasByPercentile(95);

    if (p95 === 0) return 50; // Default to medium if no history

    const congestion = Math.min(100, Math.round((current.gwei / p95) * 100));
    return congestion;
  }

  private async storeGasHistory(gasPrice: GasPrice): Promise<void> {
    try {
      await prisma.gasHistory.create({
        data: {
          gasPrice: gasPrice.gwei,
          timestamp: new Date(gasPrice.timestamp),
        },
      });
    } catch (error) {
      // Ignore errors (might be duplicate or DB issue)
      console.error('Error storing gas history:', error);
    }
  }

  async getHistoricalGasPrices(hours: number = 24): Promise<Array<{ timestamp: Date; gasPrice: number }>> {
    const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    try {
      const history = await prisma.gasHistory.findMany({
        where: {
          timestamp: {
            gte: startTime,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
        select: {
          timestamp: true,
          gasPrice: true,
        },
      });

      return history.map(h => ({
        timestamp: h.timestamp,
        gasPrice: typeof h.gasPrice === 'number' ? h.gasPrice : h.gasPrice.toNumber(),
      }));
    } catch (error) {
      console.error('Error fetching historical gas prices:', error);
      return [];
    }
  }
}

export default new GasOracleService();

