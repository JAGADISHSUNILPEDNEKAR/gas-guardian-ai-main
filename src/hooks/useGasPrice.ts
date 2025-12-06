import { useQuery } from '@tanstack/react-query';
import { gasApi, analyticsApi } from '../services/api';

export const useGasPrice = () => {
  return useQuery({
    queryKey: ['gas-price'],
    queryFn: gasApi.getCurrentGas,
    refetchInterval: 12000, // Every 12 seconds
  });
};

export const useGasPredictions = () => {
  return useQuery({
    queryKey: ['gas-predictions'],
    queryFn: gasApi.getPredictions,
    refetchInterval: 60000, // Every minute
  });
};

export const useGasHistory = () => {
  return useQuery({
    queryKey: ['gas-history'],
    queryFn: gasApi.getHistory,
    refetchInterval: 60000 * 5, // Every 5 minutes
  });
};

export const useAnalyticsStats = () => {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: async () => {
      try {
        return await analyticsApi.getStats();
      } catch (e) {
        console.warn('Failed to fetch analytics stats (auth required?)', e);
        return null;
      }
    },
    retry: false,
  });
};
