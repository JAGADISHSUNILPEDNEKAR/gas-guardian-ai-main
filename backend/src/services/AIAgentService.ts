import OpenAI from 'openai';
import redisClient from '../config/redis.js';
import { GasOracleService } from './GasOracleService.js';
import { FTSOv2Service } from './FTSOv2Service.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GasContext {
  currentGas: number;
  gasPriceUSD: number;
  flrPrice: number;
  congestion: number;
  historicalPattern?: any;
}

interface AIResponse {
  recommendation: 'EXECUTE_NOW' | 'WAIT' | 'SCHEDULE';
  reasoning: string;
  currentConditions: {
    gasPrice: number;
    gasPriceUSD: number;
    flrPrice: number;
    congestion: number;
  };
  prediction?: {
    targetGas: number;
    targetTime: string;
    confidence: number;
    timeToWait: string;
  };
  savings?: {
    amount: number;
    currency: string;
    percentage: number;
  };
  actions: Array<{
    type: string;
    label: string;
    cost: number;
    scheduledTime?: string;
  }>;
}

export class AIAgentService {
  private cacheTTL = 30; // seconds

  async getRecommendation(
    userMessage: string,
    walletAddress?: string,
    context?: any
  ): Promise<AIResponse> {
    // Check cache
    const cacheKey = `ai:${Buffer.from(userMessage).toString('base64')}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Get current gas context
    const gasContext = await this.getGasContext();

    // Build prompt
    const systemPrompt = `You are GasGuard Mentor, an AI assistant that helps users optimize gas costs on the Flare Network.

Your role:
1. Analyze current gas prices, network conditions, and historical patterns
2. Provide clear, actionable recommendations
3. Calculate potential savings
4. Suggest optimal execution timing

Current Context:
- Gas Price: ${gasContext.currentGas} Gwei
- Cost in USD: $${gasContext.gasPriceUSD.toFixed(4)}
- FLR Price: $${gasContext.flrPrice.toFixed(4)} (via FTSOv2)
- Network Congestion: ${gasContext.congestion}%

Always respond with valid JSON in this exact format:
{
  "recommendation": "EXECUTE_NOW" | "WAIT" | "SCHEDULE",
  "reasoning": "Clear explanation of your recommendation",
  "currentConditions": {
    "gasPrice": number,
    "gasPriceUSD": number,
    "flrPrice": number,
    "congestion": number
  },
  "prediction": {
    "targetGas": number,
    "targetTime": "ISO 8601 timestamp",
    "confidence": number (0-100),
    "timeToWait": "human readable string"
  },
  "savings": {
    "amount": number,
    "currency": "USD",
    "percentage": number
  },
  "actions": [
    {
      "type": "EXECUTE_NOW" | "SCHEDULE" | "SET_ALERT",
      "label": "Button label",
      "cost": number,
      "scheduledTime": "ISO 8601 timestamp (if SCHEDULE)"
    }
  ]
}`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = JSON.parse(completion.choices[0].message.content || '{}') as AIResponse;

      // Cache response
      await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(response));

      return response;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      // Fallback to rule-based system
      return this.getFallbackRecommendation(gasContext);
    }
  }

  private async getGasContext(): Promise<GasContext> {
    const gasOracle = new GasOracleService();
    const ftsoService = new FTSOv2Service();

    const currentGas = await gasOracle.getCurrentGas();
    const flrPrice = await ftsoService.getPrice('FLR/USD');
    const congestion = await gasOracle.getCongestionLevel();

    const gasPriceUSD = currentGas.gwei * 0.000000001 * 21000 * flrPrice.price; // Rough estimate

    return {
      currentGas: currentGas.gwei,
      gasPriceUSD,
      flrPrice: flrPrice.price,
      congestion,
    };
  }

  private getFallbackRecommendation(context: GasContext): AIResponse {
    // Simple rule-based fallback
    const isHighGas = context.currentGas > 30;
    const isHighCongestion = context.congestion > 70;

    let recommendation: 'EXECUTE_NOW' | 'WAIT' | 'SCHEDULE' = 'EXECUTE_NOW';
    let reasoning = '';

    if (isHighGas || isHighCongestion) {
      recommendation = 'WAIT';
      reasoning = `Current gas is ${context.currentGas} Gwei (${isHighGas ? 'HIGH' : 'MEDIUM'}). Network congestion is ${context.congestion}%. Consider waiting for better conditions.`;
    } else {
      reasoning = `Current gas is ${context.currentGas} Gwei (LOW). Network congestion is ${context.congestion}%. Good time to execute.`;
    }

    return {
      recommendation,
      reasoning,
      currentConditions: {
        gasPrice: context.currentGas,
        gasPriceUSD: context.gasPriceUSD,
        flrPrice: context.flrPrice,
        congestion: context.congestion,
      },
      actions: [
        {
          type: recommendation === 'EXECUTE_NOW' ? 'EXECUTE_NOW' : 'SCHEDULE',
          label: recommendation === 'EXECUTE_NOW' ? 'Execute Now' : 'Schedule',
          cost: context.gasPriceUSD,
        },
      ],
    };
  }
}

export default new AIAgentService();

