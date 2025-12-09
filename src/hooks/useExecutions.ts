import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useWallet } from './useWallet';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface Execution {
    id: string;
    executionId: string;
    status: 'SCHEDULED' | 'MONITORING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    transactionType: string;
    maxGasPrice: string; // BigInt as string
    actualGasPrice?: string;
    actualFlrPrice?: string;
    txHash?: string;
    gasUsed?: string;
    savedUsd?: number;
    scheduledAt: string;
    completedAt?: string;
    immediateCostUsd?: number;
    revertReason?: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

export function useExecutions() {
    const { connected } = useWallet();
    const [executions, setExecutions] = useState<Execution[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Track polling to avoid overlap
    const isPolling = useRef(false);

    const fetchExecutions = useCallback(async (page = 1, limit = 10, silent = false) => {
        // If not silent, set loading
        if (!silent) setLoading(true);
        setError(null);

        const token = localStorage.getItem('token');
        if (!token) {
            setIsAuthenticated(false);
            if (!silent) setLoading(false);
            return;
        }
        setIsAuthenticated(true);

        try {
            const response = await axios.get(`${API_URL}/api/transactions`, {
                params: { page, limit },
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.data.success) {
                setExecutions(response.data.data);
                setPagination(response.data.pagination);
            }
        } catch (err: any) {
            console.error("Error fetching executions:", err);
            // If 401, clear authenticated state
            if (err.response?.status === 401) {
                setIsAuthenticated(false);
                // Optional: clear token? localStorage.removeItem('token');
            }
            if (!silent) setError(err.response?.data?.error || err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    // Poll for updates if there are active executions
    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (connected) {
            // Initial fetch
            fetchExecutions(1, 10);

            // Start polling
            interval = setInterval(() => {
                if (!isPolling.current) {
                    isPolling.current = true;
                    fetchExecutions(1, 10, true).finally(() => {
                        isPolling.current = false;
                    });
                }
            }, 5000); // 5 seconds
        } else {
            setIsAuthenticated(false);
            setExecutions([]);
        }

        return () => clearInterval(interval);
    }, [connected, fetchExecutions]);

    return {
        executions,
        loading,
        error,
        pagination,
        isAuthenticated,
        fetchExecutions,
    };
}
