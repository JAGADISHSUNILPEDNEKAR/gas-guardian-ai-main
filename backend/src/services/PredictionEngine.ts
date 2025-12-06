import prisma from '../config/database.js';
import { GasOracleService } from './GasOracleService.js';
import { FDCService } from './FDCService.js';
import redisClient from '../config/redis.js';

interface Prediction {
  timeframe: '1h' | '6h' | '24h';
  predictedGas: number;
  confidence: number;
  trend: 'rising' | 'falling' | 'stable';
  reasoning: string;
}

export class PredictionEngine {
  private gasOracle = new GasOracleService();
  private fdcService = new FDCService();

  async getPredictions(): Promise<Prediction[]> {
    const cacheKey = 'predictions:all';
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const predictions: Prediction[] = [];

    // Get historical data
    const history = await this.gasOracle.getHistoricalGasPrices(24);
    const current = await this.gasOracle.getCurrentGas();

    // Simple moving average prediction
    const predictions_1h = this.predict1Hour(current.gwei, history);
    const predictions_6h = this.predict6Hours(current.gwei, history);
    const predictions_24h = this.predict24Hours(current.gwei, history);

    predictions.push(predictions_1h, predictions_6h, predictions_24h);

    // Cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(predictions));

    return predictions;
  }

  private predict1Hour(currentGas: number, history: any[]): Prediction {
    if (history.length < 2) {
      return {
        timeframe: '1h',
        predictedGas: currentGas,
        confidence: 50,
        trend: 'stable',
        reasoning: 'Insufficient historical data',
      };
    }

    // Use last hour's average
    const lastHour = history.slice(-4); // ~4 data points per hour (15 min intervals)
    const avg = lastHour.reduce((sum, h) => sum + h.gasPrice, 0) / lastHour.length;

    const trend = avg > currentGas ? 'falling' : avg < currentGas ? 'rising' : 'stable';
    const predictedGas = currentGas + (avg - currentGas) * 0.3; // Weighted average

    return {
      timeframe: '1h',
      predictedGas: Math.round(predictedGas * 100) / 100,
      confidence: 70,
      trend,
      reasoning: `Based on recent 1-hour patterns, gas is ${trend}.`,
    };
  }

  private predict6Hours(currentGas: number, history: any[]): Prediction {
    if (history.length < 12) {
      return {
        timeframe: '6h',
        predictedGas: currentGas,
        confidence: 50,
        trend: 'stable',
        reasoning: 'Insufficient historical data',
      };
    }

    // Use daily pattern (same time yesterday)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sameTimeYesterday = history.find(
      (h) => Math.abs(new Date(h.timestamp).getHours() - now.getHours()) < 2
    );

    if (sameTimeYesterday) {
      const predictedGas = sameTimeYesterday.gasPrice;
      const trend = predictedGas > currentGas ? 'falling' : predictedGas < currentGas ? 'rising' : 'stable';

      return {
        timeframe: '6h',
        predictedGas: Math.round(predictedGas * 100) / 100,
        confidence: 60,
        trend,
        reasoning: `Based on historical patterns at this time of day.`,
      };
    }

    // Fallback to moving average
    const avg = history.slice(-24).reduce((sum, h) => sum + h.gasPrice, 0) / Math.min(24, history.length);
    return {
      timeframe: '6h',
      predictedGas: Math.round(avg * 100) / 100,
      confidence: 55,
      trend: avg > currentGas ? 'falling' : 'rising',
      reasoning: 'Based on 6-hour moving average.',
    };
  }

  private predict24Hours(currentGas: number, history: any[]): Prediction {
    if (history.length < 24) {
      return {
        timeframe: '24h',
        predictedGas: currentGas,
        confidence: 50,
        trend: 'stable',
        reasoning: 'Insufficient historical data',
      };
    }

    // Use weekly pattern
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hourOfDay = now.getHours();

    // Find similar time patterns
    const similarTimes = history.filter((h) => {
      const d = new Date(h.timestamp);
      return d.getDay() === dayOfWeek && Math.abs(d.getHours() - hourOfDay) < 2;
    });

    if (similarTimes.length > 0) {
      const avg = similarTimes.reduce((sum, h) => sum + h.gasPrice, 0) / similarTimes.length;
      const trend = avg > currentGas ? 'falling' : avg < currentGas ? 'rising' : 'stable';

      return {
        timeframe: '24h',
        predictedGas: Math.round(avg * 100) / 100,
        confidence: 65,
        trend,
        reasoning: `Based on weekly patterns for ${now.toLocaleDateString('en-US', { weekday: 'long' })} at this time.`,
      };
    }

    // Fallback
    const avg = history.reduce((sum, h) => sum + h.gasPrice, 0) / history.length;
    return {
      timeframe: '24h',
      predictedGas: Math.round(avg * 100) / 100,
      confidence: 50,
      trend: 'stable',
      reasoning: 'Based on overall average.',
    };
  }

  async trainModel(): Promise<void> {
    // This would implement ML model training
    // For MVP, we use simple statistical methods
    // In production, this could use TensorFlow.js or call a Python service

    console.log('Training prediction model...');
    // Store model metadata in database
    await prisma.modelMetadata.upsert({
      where: { id: 'gas-prediction-v1' },
      update: {
        lastTrained: new Date(),
        version: '1.0.0',
        accuracy: 0.75, // Placeholder
      },
      create: {
        id: 'gas-prediction-v1',
        modelType: 'time-series',
        lastTrained: new Date(),
        version: '1.0.0',
        accuracy: 0.75,
      },
    });
  }
}

export default new PredictionEngine();

