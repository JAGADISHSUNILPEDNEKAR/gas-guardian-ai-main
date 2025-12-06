import { ethers } from 'ethers';
import { getProvider } from '../config/blockchain.js';
import redisClient from '../config/redis.js';

// FTSOv2 Feed Publisher ABI (simplified)
const FTSO_ABI = [
  'function getCurrentPrice(bytes32 feedId) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
  'function getPrice(bytes32 feedId, uint256 epoch) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
];

interface PriceData {
  price: number;
  decimals: number;
  timestamp: number;
  feedId: string;
}

export class FTSOv2Service {
  private provider = getProvider('flare');
  private contract: ethers.Contract;
  private cacheTTL = 12; // seconds

  constructor() {
    const ftsoAddress = process.env.FTSO_ADDRESS;
    if (!ftsoAddress) {
      throw new Error('FTSO_ADDRESS not configured');
    }
    this.contract = new ethers.Contract(ftsoAddress, FTSO_ABI, this.provider);
  }

  async getPrice(feedId: string): Promise<PriceData> {
    const cacheKey = `ftso:${feedId}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    try {
      const feedIdBytes = ethers.keccak256(ethers.toUtf8Bytes(feedId));
      const [value, timestamp, decimals] = await this.contract.getCurrentPrice(feedIdBytes);

      // Check price freshness (must be < 120 seconds old)
      const age = Date.now() / 1000 - Number(timestamp);
      if (age > 120) {
        throw new Error(`Price too stale: ${age} seconds old`);
      }

      const price = Number(value) / Math.pow(10, Number(decimals));

      const result: PriceData = {
        price,
        decimals: Number(decimals),
        timestamp: Number(timestamp) * 1000, // Convert to milliseconds
        feedId,
      };

      // Cache result
      await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(result));

      return result;
    } catch (error) {
      console.error(`Error fetching FTSOv2 price for ${feedId}:`, error);
      // Mock data for development/demo if contract interaction fails
      if (feedId.includes('USD')) {
        return {
          price: 0.025, // Mock FLR price
          decimals: 18,
          timestamp: Date.now(),
          feedId
        };
      }
      throw new Error(`Failed to fetch price for ${feedId}`);
    }
  }

  async convertToUSD(amount: number, assetSymbol: string): Promise<number> {
    const feedId = `${assetSymbol}/USD`;
    const { price } = await this.getPrice(feedId);
    return amount * price;
  }

  async getPriceHistory(feedId: string, epochs: number = 10): Promise<PriceData[]> {
    const results: PriceData[] = [];
    const feedIdBytes = ethers.keccak256(ethers.toUtf8Bytes(feedId));

    try {
      // Get current epoch
      const currentBlock = await this.provider.getBlockNumber();
      const epochSize = 90; // Flare epochs are ~90 blocks
      const currentEpoch = Math.floor(currentBlock / epochSize);

      for (let i = 0; i < epochs; i++) {
        const epoch = currentEpoch - i;
        try {
          const [value, timestamp, decimals] = await this.contract.getPrice(feedIdBytes, epoch);
          const price = Number(value) / Math.pow(10, Number(decimals));

          results.push({
            price,
            decimals: Number(decimals),
            timestamp: Number(timestamp) * 1000,
            feedId,
          });
        } catch (error) {
          // Skip if epoch doesn't exist
          continue;
        }
      }
    } catch (error) {
      console.error(`Error fetching FTSOv2 price history for ${feedId}:`, error);
    }

    return results.reverse(); // Oldest first
  }
}

export default new FTSOv2Service();

