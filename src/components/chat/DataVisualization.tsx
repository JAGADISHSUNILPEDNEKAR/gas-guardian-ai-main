import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DataVisualizationProps {
  data?: {
    gasPrice?: number;
    flrPrice?: number;
    congestion?: number;
    savings?: number;
  };
  historicalData?: Array<{ timestamp: number; gasPrice: number }>;
}

export function DataVisualization({ data, historicalData }: DataVisualizationProps) {
  const chartData = historicalData?.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString(),
    gas: item.gasPrice,
  })) || [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Gas Price Trend</CardTitle>
          <CardDescription>Last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="gas" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-muted-foreground">
              No historical data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Metrics</CardTitle>
          <CardDescription>Current snapshot</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data?.gasPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Gas Price</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.gasPrice} Gwei</span>
                <TrendingDown className="h-4 w-4 text-green-500" />
              </div>
            </div>
          )}
          {data?.flrPrice && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">FLR Price</span>
              <span className="font-semibold">${data.flrPrice.toFixed(4)}</span>
            </div>
          )}
          {data?.congestion && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network Congestion</span>
              <span className="font-semibold">{data.congestion}%</span>
            </div>
          )}
          {data?.savings && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Potential Savings</span>
              <span className="font-semibold text-green-500">${data.savings.toFixed(2)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

