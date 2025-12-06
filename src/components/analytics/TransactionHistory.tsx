import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Download } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Transaction {
  id: string;
  executionId: string;
  status: string;
  transactionType: string;
  actualGasPrice?: number;
  actualCostUsd?: number;
  savedUsd?: number;
  savingsPercentage?: number;
  executedAt?: string;
  txHash?: string;
}

export function TransactionHistory() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  // In a real implementation, this would fetch from the API
  // For now, using mock data structure
  const fetchTransactions = async () => {
    try {
      // This would be: GET /api/transactions/history
      // const response = await axios.get(`${API_URL}/api/transactions/history`, {
      //   headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      // });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.status.toLowerCase() === filter.toLowerCase();
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      COMPLETED: 'default',
      SCHEDULED: 'secondary',
      MONITORING: 'secondary',
      FAILED: 'destructive',
      REFUNDED: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View your gas optimization history</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Transactions</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No transactions found
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Gas Price</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Saved</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    {tx.executedAt
                      ? new Date(tx.executedAt).toLocaleDateString()
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{tx.transactionType || 'CUSTOM'}</TableCell>
                  <TableCell>{getStatusBadge(tx.status)}</TableCell>
                  <TableCell>
                    {tx.actualGasPrice ? `${tx.actualGasPrice} Gwei` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tx.actualCostUsd ? `$${tx.actualCostUsd.toFixed(4)}` : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {tx.savedUsd ? (
                      <span className="text-green-500 font-semibold">
                        ${tx.savedUsd.toFixed(2)}
                        {tx.savingsPercentage && ` (${tx.savingsPercentage.toFixed(0)}%)`}
                      </span>
                    ) : (
                      'N/A'
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.txHash && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          window.open(
                            `https://flare-explorer.flare.network/tx/${tx.txHash}`,
                            '_blank'
                          )
                        }
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

