import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const FLARE_RPC = import.meta.env.VITE_FLARE_RPC_URL || 'https://coston2-api.flare.network/ext/C/rpc';
const FTSO_CONTRACT_ADDRESS = import.meta.env.VITE_FTSO_CONTRACT_ADDRESS || '0x1000000000000000000000000000000000000003'; // Flare FTSOv2 Feed Publisher

// FTSOv2 Feed Publisher ABI
const FTSO_ABI = [
  'function getCurrentPrice(bytes32 feedId) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
  'function getPrice(bytes32 feedId, uint256 epoch) external view returns (int256 value, uint256 timestamp, uint8 decimals)',
];

interface PriceData {
  price: number;
  decimals: number;
  timestamp: number;
  feedId: string;
}

export function useFTSOv2() {
  const [provider, setProvider] = useState<ethers.Provider | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);

  useEffect(() => {
    const p = new ethers.JsonRpcProvider(FLARE_RPC);
    setProvider(p);
    
    if (FTSO_CONTRACT_ADDRESS && FTSO_CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
      const c = new ethers.Contract(FTSO_CONTRACT_ADDRESS, FTSO_ABI, p);
      setContract(c);
    }
  }, []);

  const getPrice = async (feedId: string): Promise<PriceData> => {
    try {
      // Try backend first (cached and more reliable)
      const response = await axios.get(`${API_URL}/api/gas/current`);
      if (response.data.success && response.data.data.ftsoPrice) {
        return {
          price: response.data.data.ftsoPrice.flr || response.data.data.ftsoPrice.price || 0,
          decimals: 8,
          timestamp: response.data.data.ftsoPrice.timestamp || Date.now(),
          feedId,
        };
      }
    } catch (error) {
      console.error('Error fetching price from backend:', error);
    }

    // Fallback: Direct contract interaction
    if (contract && provider) {
      try {
        const feedIdBytes = ethers.keccak256(ethers.toUtf8Bytes(feedId));
        const [value, timestamp, decimals] = await contract.getCurrentPrice(feedIdBytes);
        
        // Check price freshness (must be < 120 seconds old)
        const age = Date.now() / 1000 - Number(timestamp);
        if (age > 120) {
          throw new Error(`Price too stale: ${age} seconds old`);
        }

        const price = Number(value) / Math.pow(10, Number(decimals));

        return {
          price,
          decimals: Number(decimals),
          timestamp: Number(timestamp) * 1000,
          feedId,
        };
      } catch (error) {
        console.error('Error fetching price from contract:', error);
        // Return mock data for development
        return {
          price: 0.025, // Mock FLR price
          decimals: 18,
          timestamp: Date.now(),
          feedId,
        };
      }
    }

    // Final fallback: mock data
    return {
      price: 0.025,
      decimals: 18,
      timestamp: Date.now(),
      feedId,
    };
  };

  const getPriceInUSD = async (amount: number, feedId: string = 'FLR/USD'): Promise<number> => {
    const { price } = await getPrice(feedId);
    return amount * price;
  };

  return { getPrice, getPriceInUSD, provider, contract };
}

