import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface GasChartProps {
  data?: {
    time: string;
    gas: number;
    prediction?: number;
  }[];
  isLoading?: boolean;
}

export function GasChart({ data, isLoading }: GasChartProps) {
  return (
    <Card variant="glass">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">24-Hour Gas Trends</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">Real-time gas prices with AI predictions</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Actual</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-xs text-muted-foreground">Predicted</span>
          </div>
          <Badge variant="glow">Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          {isLoading ? (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(180, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="predictionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(270, 80%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222, 30%, 18%)" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(215, 20%, 55%)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value} gwei`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.4)",
                  }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                  itemStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
                <Area
                  type="monotone"
                  dataKey="prediction"
                  stroke="hsl(270, 80%, 60%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="url(#predictionGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="gas"
                  stroke="hsl(180, 100%, 50%)"
                  strokeWidth={2}
                  fill="url(#gasGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-muted/50 p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-sm font-medium text-success">Optimal window: 4:00 - 6:00 AM UTC</span>
          </div>
          <span className="text-sm text-muted-foreground">Avg. savings: ~60%</span>
        </div>
      </CardContent>
    </Card>
  );
}
