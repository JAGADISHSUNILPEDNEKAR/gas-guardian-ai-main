import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Alert {
  id: string;
  alertType: string;
  condition: {
    type: 'gas_price' | 'asset_price' | 'congestion';
    operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
    value: number;
  };
  notificationChannels: {
    browser?: boolean;
    email?: boolean;
    telegram?: boolean;
    discord?: boolean;
  };
  status: string;
  lastTriggeredAt?: string;
  triggerCount: number;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/alerts`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        setAlerts(response.data.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async (
    alertType: string,
    condition: Alert['condition'],
    notificationChannels: Alert['notificationChannels']
  ) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/alerts`,
        {
          alertType,
          condition,
          notificationChannels,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        await fetchAlerts();
        return response.data.data;
      }
      throw new Error('Failed to create alert');
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/api/alerts/${alertId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.data.success) {
        await fetchAlerts();
      } else {
        throw new Error('Failed to delete alert');
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || err.message);
    }
  };

  return {
    alerts,
    loading,
    error,
    createAlert,
    deleteAlert,
    refetch: fetchAlerts,
  };
}

