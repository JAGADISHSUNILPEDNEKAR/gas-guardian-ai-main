import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { useGasGuard } from '@/hooks/useGasGuard';
import { useGasPrice } from '@/hooks/useGasPrice';

interface MonitoringDisplayProps {
  executionId: string;
  maxGasPrice: number;
  minFlrPrice: number;
  deadline: number;
}

export function MonitoringDisplay({
  executionId,
  maxGasPrice,
  minFlrPrice,
  deadline,
}: MonitoringDisplayProps) {
  const { data: gasData } = useGasPrice();
  const { getTransactionStatus } = useGasGuard();
  const [status, setStatus] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const txStatus = await getTransactionStatus(executionId);
        setStatus(txStatus);
      } catch (error) {
        console.error('Error fetching status:', error);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Every 5 seconds
    return () => clearInterval(interval);
  }, [executionId, getTransactionStatus]);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = deadline - now;

      if (remaining <= 0) {
        setTimeRemaining('Deadline passed');
        return;
      }

      const hours = Math.floor(remaining / 3600);
      const minutes = Math.floor((remaining % 3600) / 60);
      const seconds = remaining % 60;

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  if (!gasData) {
    return <div>Loading...</div>;
  }

  const gasOk = gasData.gasPrice.gwei <= maxGasPrice;
  const priceOk = gasData.ftsoPrice.flr >= minFlrPrice;
  const allOk = gasOk && priceOk;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Monitoring Conditions
        </CardTitle>
        <CardDescription>Execution ID: {executionId.slice(0, 10)}...</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Gas Price</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">{gasData.gasPrice.gwei} Gwei</span>
              {gasOk ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Target: ≤ {maxGasPrice} Gwei
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>FLR Price</span>
            <div className="flex items-center gap-2">
              <span className="font-mono">${gasData.ftsoPrice.flr.toFixed(4)}</span>
              {priceOk ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Target: ≥ ${minFlrPrice.toFixed(4)}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Time Remaining</span>
            <Badge variant={timeRemaining.includes('passed') ? 'destructive' : 'default'}>
              {timeRemaining}
            </Badge>
          </div>
        </div>

        {status && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge>{status.status}</Badge>
            </div>
            {status.savedUsd && (
              <div className="mt-2 text-sm text-green-500">
                Estimated Savings: ${Number(status.savedUsd).toFixed(2)}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button variant="outline" className="flex-1">
            Force Execute
          </Button>
          <Button variant="destructive" className="flex-1">
            Cancel & Refund
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

