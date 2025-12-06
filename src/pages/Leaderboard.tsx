import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award } from 'lucide-react';
import { Achievements } from '@/components/leaderboard/Achievements';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  totalSaved: number;
  transactionCount: number;
  optimalRate: number;
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'all' | 'month'>('all');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/leaderboard`, {
          params: { timeframe, limit: 100 },
        });
        if (response.data.success) {
          setLeaderboard(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 300000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [timeframe]);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          <span className="gradient-text">Leaderboard</span>
        </h1>
        <p className="text-muted-foreground">
          Top gas optimizers and your achievements
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Global Leaderboard</CardTitle>
                  <CardDescription>Top savers by total gas savings</CardDescription>
                </div>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value as 'all' | 'month')}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Time</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading leaderboard...</div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No data available</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Total Saved</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Optimal Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((entry) => (
                      <TableRow key={entry.rank}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getRankIcon(entry.rank)}
                            <span className="font-semibold">#{entry.rank}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-sm">{formatAddress(entry.walletAddress)}</code>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-green-500">
                            ${entry.totalSaved.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{entry.transactionCount}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{entry.optimalRate.toFixed(0)}%</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Achievements
            userStats={{
              totalSaved: 125.40, // Would come from API
              transactionCount: 47,
              optimalRate: 87,
            }}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default Leaderboard;

