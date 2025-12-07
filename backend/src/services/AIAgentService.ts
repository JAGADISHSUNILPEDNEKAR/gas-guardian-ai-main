import OpenAI from 'openai';
import redisClient from '../config/redis.js';
import { GasOracleService } from './GasOracleService.js';
import { FTSOv2Service } from './FTSOv2Service.js';
import { FDCService } from './FDCService.js';

// Detect if using Groq (API key starts with 'gsk_') or OpenAI
const apiKey = process.env.OPENAI_API_KEY || '';
const isGroq = apiKey.startsWith('gsk_');

// IMPORTANT: Validate API key on startup
if (!apiKey || apiKey.trim() === '') {
  console.warn('⚠️  WARNING: OPENAI_API_KEY not configured in environment variables!');
  console.warn('⚠️  AI chat will use fallback responses. Add your API key to backend/.env');
} else {
  console.log(`✅ AI API configured (${isGroq ? 'Groq' : 'OpenAI'})`);
}

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
    if (redisClient && redisClient.isConnected()) {
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

    // Check if API key is configured
    if (!apiKey || apiKey.trim() === '') {
      console.warn('⚠️  No API key - using fallback response');
      return this.getFallbackRecommendation(gasContext);
    }

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

    try {
      console.log(`🤖 Calling ${isGroq ? 'Groq' : 'OpenAI'} API...`);

      // Use appropriate model based on provider
      const model = isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4o-mini';

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
        throw new Error('Empty response from AI API');
      }

      console.log(`✅ ${isGroq ? 'Groq' : 'OpenAI'} API response received`);

      const response = JSON.parse(responseContent) as AIResponse;

      // Validate response structure
      if (!response.recommendation || !response.reasoning) {
        console.error('❌ Invalid response format:', response);
        throw new Error('Invalid response format from AI API');
      }

      // Cache response (if Redis is available)
      if (redisClient && redisClient.isConnected()) {
        try {
          await redisClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(response));
        } catch (error) {
          console.warn('⚠️  Cache write error (continuing):', error);
        }
      }

      console.log(`✅ ${isGroq ? 'Groq' : 'OpenAI'} API call successful`);
      return response;

    } catch (error: any) {
      console.error(`❌ ${isGroq ? 'Groq' : 'OpenAI'} API Error:`, error.message || error);

      // Log more details for debugging
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        });
      }

      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error('❌ Network error - cannot reach API endpoint');
      }

      if (error.status === 401) {
        console.error('❌ Invalid API key - check your OPENAI_API_KEY in backend/.env');
      }

      if (error.status === 429) {
        console.error('❌ Rate limit exceeded - too many requests');
      }

      // Fallback to rule-based system
      console.log('⚠️  Falling back to rule-based recommendations');
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

    const gasPriceUSD = currentGas.gwei * 0.000000001 * 21000 * flrPrice.price;

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
    let savings = 0;

    if (isHighGas || isHighCongestion) {
      recommendation = 'WAIT';
      savings = context.gasPriceUSD * 0.4; // 40% potential savings
      reasoning = `⚠️ **Using Fallback Mode** (Configure OPENAI_API_KEY for AI recommendations)\n\nCurrent gas is ${context.currentGas.toFixed(2)} Gwei (${isHighGas ? 'HIGH' : 'MEDIUM'}). Network congestion is ${context.congestion}%. Consider waiting for better conditions to save ~$${savings.toFixed(2)}.`;
    } else {
      reasoning = `⚠️ **Using Fallback Mode** (Configure OPENAI_API_KEY for AI recommendations)\n\nCurrent gas is ${context.currentGas.toFixed(2)} Gwei (LOW). Network congestion is ${context.congestion}%. Good time to execute.`;
    }

    const targetTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now

    return {
      recommendation,
      reasoning,
      currentConditions: {
        gasPrice: context.currentGas,
        gasPriceUSD: context.gasPriceUSD,
        flrPrice: context.flrPrice,
        congestion: context.congestion,
      },
      prediction: recommendation === 'WAIT' ? {
        targetGas: context.currentGas * 0.7,
        targetTime: targetTime.toISOString(),
        confidence: 60,
        timeToWait: '2 hours',
      } : undefined,
      savings: {
        amount: savings,
        currency: 'USD',
        percentage: recommendation === 'WAIT' ? 40 : 0,
      },
      actions: [
        {
          type: recommendation === 'EXECUTE_NOW' ? 'EXECUTE_NOW' : 'SCHEDULE',
          label: recommendation === 'EXECUTE_NOW' ? 'Execute Now' : 'Schedule for Later',
          cost: context.gasPriceUSD,
          scheduledTime: recommendation === 'WAIT' ? targetTime.toISOString() : undefined,
        },
      ],
    };
  }
}

export default new AIAgentService();