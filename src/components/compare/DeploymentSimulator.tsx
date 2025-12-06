import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function DeploymentSimulator() {
  const [contractCode, setContractCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const estimateGas = (code: string): number => {
    // Simplified estimation: ~200 gas per byte
    const bytecodeSize = code.length / 2; // Rough estimate
    return Math.floor(bytecodeSize * 200);
  };

  const handleSimulate = async () => {
    if (!contractCode.trim()) {
      alert('Please paste contract code');
      return;
    }

    setLoading(true);
    try {
      const gasUnits = estimateGas(contractCode);
      const contractSize = contractCode.length;

      const response = await axios.post(`${API_URL}/api/compare/deployment`, {
        gasUnits,
        contractSize,
      });

      if (response.data.success) {
        setResults(response.data.data);
      }
    } catch (error) {
      console.error('Simulation error:', error);
      alert('Failed to simulate deployment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deployment Simulator</CardTitle>
        <CardDescription>
          Paste your contract code to compare deployment costs across chains
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Contract Bytecode (hex)</Label>
          <Textarea
            value={contractCode}
            onChange={(e) => setContractCode(e.target.value)}
            placeholder="0x6080604052..."
            rows={6}
            className="font-mono text-sm"
          />
        </div>

        <Button onClick={handleSimulate} disabled={loading} className="w-full">
          {loading ? 'Simulating...' : 'Simulate Deployment'}
        </Button>

        {results && (
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Comparison Results</h3>
            <div className="space-y-2">
              {results.comparisons.map((comp: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{comp.chain}</div>
                    <div className="text-sm text-muted-foreground">
                      {comp.gasPrice} Gwei • {comp.time}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">${comp.costUsd.toFixed(2)}</div>
                    <div className="text-xs">
                      {comp.recommendation === 'BEST_VALUE' && '⭐ Best Value'}
                      {comp.recommendation === 'CHEAPEST' && '💰 Cheapest'}
                      {comp.recommendation === 'TOO_EXPENSIVE' && '❌ Too Expensive'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Last updated: {new Date(results.lastUpdated).toLocaleString()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

