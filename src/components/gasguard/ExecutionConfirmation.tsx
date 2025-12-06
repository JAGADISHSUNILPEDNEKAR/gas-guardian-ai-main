import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, Copy } from 'lucide-react';
import { useState } from 'react';

interface ExecutionConfirmationProps {
  transaction: {
    executionId: string;
    txHash?: string;
    gasPrice: number;
    flrPrice: number;
    actualCost: number;
    savedUsd: number;
    blockNumber?: number;
  };
  onViewDetails?: () => void;
}

export function ExecutionConfirmation({ transaction, onViewDetails }: ExecutionConfirmationProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl = `https://flare-explorer.flare.network/tx/${transaction.txHash}`;

  return (
    <Card className="border-green-500">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6 text-green-500" />
          <CardTitle>Transaction Executed</CardTitle>
        </div>
        <CardDescription>Your transaction completed successfully with optimal conditions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Gas Price</span>
            <Badge variant="outline">{transaction.gasPrice} Gwei</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">FLR Price</span>
            <span className="font-semibold">${transaction.flrPrice.toFixed(4)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Actual Cost</span>
            <span className="font-semibold">${transaction.actualCost.toFixed(4)}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-green-500/10 rounded-lg border border-green-500/20">
            <span className="text-sm font-medium">Total Saved</span>
            <span className="font-bold text-green-500">${transaction.savedUsd.toFixed(2)}</span>
          </div>
        </div>

        {transaction.txHash && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Transaction Hash</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono">
                  {transaction.txHash.slice(0, 10)}...{transaction.txHash.slice(-8)}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.txHash!)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(explorerUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {transaction.blockNumber && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Block Number</span>
                <span className="font-mono text-sm">{transaction.blockNumber}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          {onViewDetails && (
            <Button onClick={onViewDetails} className="flex-1">
              View Details
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => window.location.href = '/gasguard'}
          >
            Schedule Another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

