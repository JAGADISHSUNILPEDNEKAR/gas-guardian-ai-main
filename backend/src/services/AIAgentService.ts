import OpenAI from 'openai';
import redisClient from '../config/redis.js';
import { GasOracleService } from './GasOracleService.js';
import { FTSOv2Service } from './FTSOv2Service.js';
import { FDCService } from './FDCService.js';

// Detect if using Groq (API key starts with 'gsk_') or OpenAI
const apiKey = process.env.OPENAI_API_KEY || '';
const isGroq = apiKey.startsWith('gsk_');

const openai = new OpenAI({
  apiKey: apiKey,
  baseURL: isGroq ? 'https://api.groq.com/openai/v1' : undefined,
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
    // Check cache (if Redis is available)
    const cacheKey = `ai:${Buffer.from(userMessage).toString('base64')}`;
    if (redisClient && redisClient.isOpen) {
      try {
        const cached = await redisClient.get(cacheKey);
        if (cached) {
          console.log('✅ Using cached AI response');
          return JSON.parse(cached);
        }
      } catch (error) {
        console.warn('⚠️  Cache read error (continuing):', error);
      }
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
${gasContext.historicalPattern ? `
Historical Patterns (from FDC - 30 days):
- Average Gas: ${gasContext.historicalPattern.averageGas.toFixed(2)} Gwei
- Min Gas: ${gasContext.historicalPattern.minGas.toFixed(2)} Gwei
- Max Gas: ${gasContext.historicalPattern.maxGas.toFixed(2)} Gwei
- Trend: ${gasContext.historicalPattern.trend}
` : ''}

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

    // Check if API key is configured
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️  AI API key not configured. Using fallback recommendation.');
      return this.getFallbackRecommendation(gasContext);
    }

    try {
      // Use appropriate model based on provider
      const model = isGroq ? 'llama-3.1-70b-versatile' : 'gpt-4';
      
      const completion = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 1000,
      });

      const responseContent = completion.choices[0].message.content;
      if (!responseContent) {
        throw new Error('Empty response from OpenAI');
      }

      const response = JSON.parse(responseContent) as AIResponse;

      // Validate response structure
      if (!response.recommendation || !response.reasoning) {
        throw new Error('Invalid response format from OpenAI');
      }

      // Cache response (if Redis is available)
      if (redisClient && redisClient.isOpen) {
        await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(response));
      }

      console.log(`✅ ${isGroq ? 'Groq' : 'OpenAI'} API call successful`);
      return response;
    } catch (error: any) {
      console.error(`❌ ${isGroq ? 'Groq' : 'OpenAI'} API Error:`, error.message || error);
      console.error('Error details:', {
        code: error.code,
        status: error.status,
        type: error.type,
      });
      // Fallback to rule-based system
      return this.getFallbackRecommendation(gasContext);
    }
  }

  private async getGasContext(): Promise<GasContext> {
    const gasOracle = new GasOracleService();
    const ftsoService = new FTSOv2Service();
    const fdcService = new FDCService();

    const currentGas = await gasOracle.getCurrentGas();
    const flrPrice = await ftsoService.getPrice('FLR/USD');
    const congestion = await gasOracle.getCongestionLevel();

    // Get historical patterns from FDC (30-day data for AI predictions)
    let historicalPattern = null;
    try {
      const history = await fdcService.getHistoricalGasPrices(30);
      if (history.length > 0) {
        historicalPattern = {
          dataPoints: history.length,
          averageGas: history.reduce((sum, h) => sum + h.gasPrice, 0) / history.length,
          minGas: Math.min(...history.map(h => h.gasPrice)),
          maxGas: Math.max(...history.map(h => h.gasPrice)),
          trend: history.length > 1 ? (history[history.length - 1].gasPrice > history[0].gasPrice ? 'RISING' : 'FALLING') : 'STABLE',
        };
      }
    } catch (error) {
      console.error('Error fetching FDC historical data:', error);
    }

    const gasPriceUSD = currentGas.gwei * 0.000000001 * 21000 * flrPrice.price; // Rough estimate

    return {
      currentGas: currentGas.gwei,
      gasPriceUSD,
      flrPrice: flrPrice.price,
      congestion,
      historicalPattern,
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

