import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const FLARE_RPC = import.meta.env.VITE_FLARE_RPC_URL || 'https://flare-api.flare.network/ext/bc/C/rpc';

interface PriceData {
  price: number;
  decimals: number;
  timestamp: number;
  feedId: string;
}

export function useFTSOv2() {
  const [provider, setProvider] = useState<ethers.Provider | null>(null);

  useEffect(() => {
    const p = new ethers.JsonRpcProvider(FLARE_RPC);
    setProvider(p);
  }, []);

  const getPrice = async (feedId: string): Promise<PriceData> => {
    try {
      // Try backend first (cached)
      const response = await axios.get(`${API_URL}/api/gas/current`);
      if (response.data.success && feedId === 'FLR/USD') {
        return {
          price: response.data.data.ftsoPrice.flr,
          decimals: 8,
          timestamp: response.data.data.ftsoPrice.timestamp,
          feedId,
        };
      }
    } catch (error) {
      console.error('Error fetching price from backend:', error);
    }

    // Fallback: would need contract interaction
    throw new Error('Price fetch not fully implemented');
  };

  const getPriceInUSD = async (amount: number, feedId: string = 'FLR/USD'): Promise<number> => {
    const { price } = await getPrice(feedId);
    return amount * price;
  };

  return { getPrice, getPriceInUSD, provider };
}

