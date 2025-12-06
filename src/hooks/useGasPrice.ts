import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface GasPriceData {
  gasPrice: {
    gwei: number;
    wei: string;
  };
  prices: {
    flr: number;
    usd: number;
  };
  network: {
    congestion: number;
    blockNumber: number;
    blockTime: number;
  };
  ftsoPrice: {
    flr: number;
    timestamp: number;
  };
  status: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export function useGasPrice() {
  const [data, setData] = useState<GasPriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGasPrice = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/api/gas/current`);
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch gas price');
      }
    } catch (err: any) {
      console.error('Gas price fetch error:', err);
      setError(err.message || 'Failed to fetch gas data');
      // Don't clear data on error, keep showing last known good data
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGasPrice();
    const interval = setInterval(fetchGasPrice, 12000); // Every 12 seconds
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error, refetch: fetchGasPrice };
}

