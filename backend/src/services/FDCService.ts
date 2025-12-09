import { ethers } from 'ethers';
import { getProvider } from '../config/blockchain.js';
import redisClient from '../config/redis.js';

// FDC Connector ABI (simplified)
const FDC_ABI = [
  'function requestData(bytes32 requestId) external returns (bytes32)',
  'function getRequestResult(bytes32 requestId) external view returns (bool verified, bytes data)',
];

interface FDCRequest {
  attestationType: string;
  sourceId: string;
  requestBody: any;
}

interface CrossChainGasPrices {
  ethereum?: number;
  polygon?: number;
  bsc?: number;
  avalanche?: number;
  flare: number;
}

export class FDCService {
  private provider = getProvider('coston2'); // Use Coston2 by default
  private contract: ethers.Contract | null = null;

  constructor() {
    // Flare FDC Connector address
    // For Coston2: 0x1000000000000000000000000000000000000004
    const fdcAddress = process.env.FDC_ADDRESS || process.env.FDC_CONTRACT_ADDRESS || '0x1000000000000000000000000000000000000004';
    if (fdcAddress && fdcAddress !== '0x0000000000000000000000000000000000000000') {
      this.contract = new ethers.Contract(fdcAddress, FDC_ABI, this.provider);
    }
  }

  async getHistoricalGasPrices(days: number = 30): Promise<Array<{ timestamp: number; gasPrice: number }>> {
    const cacheKey = `fdc:gas:history:${days}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    if (!this.contract) {
      // Fallback: return empty array if FDC not configured
      console.warn('FDC contract not configured, returning empty history');
      return [];
    }

    try {
      const endTime = Math.floor(Date.now() / 1000);
      const startTime = endTime - days * 24 * 60 * 60;

      const request: FDCRequest = {
        attestationType: 'GAS_PRICE_HISTORY',
        sourceId: 'FLARE_MAINNET',
        requestBody: {
          startTimestamp: startTime,
          endTimestamp: endTime,
          granularity: 3600, // 1 hour intervals
        },
      };

      const requestId = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(request)));
      const tx = await this.contract.requestData(requestId);
      await tx.wait();

      // Poll for result
      const result = await this.pollForResult(requestId, 20);

      // Cache for 1 hour
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result.data || []));

      return result.data || [];
    } catch (error) {
      console.error('Error fetching FDC historical gas prices:', error);
      return [];
    }
  }

  async getCrossChainGasPrices(): Promise<CrossChainGasPrices> {
    const cacheKey = 'fdc:gas:crosschain';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    if (!this.contract) {
      // Fallback: return Flare-only data
      const gasOracle = (await import('./GasOracleService.js')).default;
      const current = await gasOracle.getCurrentGas();
      return { flare: current.gwei };
    }

    const chains = ['ETHEREUM', 'POLYGON', 'BSC', 'AVALANCHE'];
    const gasPrices: CrossChainGasPrices = { flare: 0 };

    try {
      // Get Flare gas price
      const gasOracle = (await import('./GasOracleService.js')).default;
      const flareGas = await gasOracle.getCurrentGas();
      gasPrices.flare = flareGas.gwei;

      // Request cross-chain data
      const requests = chains.map((chain) => ({
        attestationType: 'CURRENT_GAS_PRICE',
        sourceId: chain,
        requestBody: { timestamp: Math.floor(Date.now() / 1000) },
      }));

      const results = await Promise.all(
        requests.map(async (req) => {
          try {
            const requestId = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(req)));
            const tx = await this.contract!.requestData(requestId);
            await tx.wait();
            const result = await this.pollForResult(requestId, 10);
            return { chain: req.sourceId.toLowerCase(), gasPrice: result.data?.gasPrice || 0 };
          } catch (error) {
            console.error(`Error fetching gas for ${req.sourceId}:`, error);
            return { chain: req.sourceId.toLowerCase(), gasPrice: 0 };
          }
        })
      );

      results.forEach(({ chain, gasPrice }) => {
        if (gasPrice > 0) {
          gasPrices[chain as keyof CrossChainGasPrices] = gasPrice;
        }
      });

      // Cache for 5 minutes
      await redisClient.setEx(cacheKey, 300, JSON.stringify(gasPrices));

      return gasPrices;
    } catch (error) {
      console.error('Error fetching cross-chain gas prices:', error);
      return gasPrices;
    }
  }

  private async pollForResult(requestId: string, maxAttempts: number = 20): Promise<any> {
    if (!this.contract) {
      throw new Error('FDC contract not configured');
    }

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const [verified, data] = await this.contract.getRequestResult(requestId);

        if (verified) {
          return JSON.parse(ethers.toUtf8String(data));
        }

        await new Promise((resolve) => setTimeout(resolve, 3000)); // Wait 3s
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw new Error('FDC request timeout');
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }

    throw new Error('FDC request timeout');
  }
}

export default new FDCService();

