import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TransactionBuilderProps {
  onSchedule: (transaction: any, safetyParams: any) => void;
}

export function TransactionBuilder({ onSchedule }: TransactionBuilderProps) {
  const [transaction, setTransaction] = useState({
    target: '',
    data: '',
    value: '0',
    type: 'CUSTOM',
  });

  const [safetyParams, setSafetyParams] = useState({
    maxGasPrice: 30,
    minFlrPrice: 0.014,
    maxSlippage: 100,
    deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(transaction, safetyParams);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Transaction</CardTitle>
        <CardDescription>Configure your transaction and safety parameters</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label>Transaction Type</Label>
            <Select
              value={transaction.type}
              onValueChange={(value) => setTransaction({ ...transaction, type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SWAP">Swap</SelectItem>
                <SelectItem value="TRANSFER">Transfer</SelectItem>
                <SelectItem value="DEPLOY">Deploy Contract</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Address</Label>
            <Input
              value={transaction.target}
              onChange={(e) => setTransaction({ ...transaction, target: e.target.value })}
              placeholder="0x..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Transaction Data (hex)</Label>
            <Textarea
              value={transaction.data}
              onChange={(e) => setTransaction({ ...transaction, data: e.target.value })}
              placeholder="0x..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Value (FLR)</Label>
            <Input
              type="number"
              value={transaction.value}
              onChange={(e) => setTransaction({ ...transaction, value: e.target.value })}
              placeholder="0"
              step="0.000000000000000001"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Safety Parameters</h3>

            <div className="space-y-2">
              <Label>Max Gas Price (Gwei)</Label>
              <Input
                type="number"
                value={safetyParams.maxGasPrice}
                onChange={(e) =>
                  setSafetyParams({ ...safetyParams, maxGasPrice: Number(e.target.value) })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Min FLR Price (USD)</Label>
              <Input
                type="number"
                value={safetyParams.minFlrPrice}
                onChange={(e) =>
                  setSafetyParams({ ...safetyParams, minFlrPrice: Number(e.target.value) })
                }
                step="0.0001"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Max Slippage (basis points)</Label>
              <Input
                type="number"
                value={safetyParams.maxSlippage}
                onChange={(e) =>
                  setSafetyParams({ ...safetyParams, maxSlippage: Number(e.target.value) })
                }
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Schedule Execution
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

