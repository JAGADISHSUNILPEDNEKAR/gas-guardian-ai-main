import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Prediction {
  timeframe: '1h' | '6h' | '24h';
  predictedGas: number;
  confidence: number;
  trend: 'rising' | 'falling' | 'stable';
  reasoning: string;
}

export function PredictionWidget() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/gas/predictions`);
        if (response.data.success) {
          setPredictions(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching predictions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
    const interval = setInterval(fetchPredictions, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'rising':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'falling':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gas Predictions</CardTitle>
          <CardDescription>Loading predictions...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gas Predictions</CardTitle>
        <CardDescription>AI-powered gas price forecasts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.map((pred) => (
          <div key={pred.timeframe} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{pred.timeframe.toUpperCase()}</span>
                {getTrendIcon(pred.trend)}
              </div>
              <div className="text-2xl font-bold mt-1">{pred.predictedGas.toFixed(2)} Gwei</div>
              <div className="text-sm text-muted-foreground mt-1">
                Confidence: {pred.confidence}%
              </div>
            </div>
            <div className="text-sm text-muted-foreground max-w-xs">
              {pred.reasoning}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

