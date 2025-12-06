import { useState } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface SafetyParams {
  maxGasPrice: number; // Gwei
  minFlrPrice: number;
  maxSlippage: number;
  deadline: number; // Unix timestamp
}

interface Transaction {
  target: string;
  data: string;
  value?: string;
  type?: string;
}

export function useGasGuard() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleExecution = async (
    transaction: Transaction,
    safetyParams: SafetyParams,
    walletAddress?: string
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/transactions/schedule`,
        {
          transaction,
          safetyParams,
          walletAddress,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || 'Failed to schedule execution');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTransactionStatus = async (executionId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/transactions/${executionId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        return response.data.data;
      }
      throw new Error('Failed to fetch transaction status');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message);
    }
  };

  return {
    scheduleExecution,
    getTransactionStatus,
    loading,
    error,
  };
}

