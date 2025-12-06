import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
    timeout: 10000,
});

export const gasApi = {
    getCurrentGas: async () => {
        const response = await api.get('/gas/current');
        return response.data;
    },
    getPredictions: async () => {
        const response = await api.get('/gas/predictions');
        return response.data;
    },
    getHistory: async () => {
        const response = await api.get('/gas/history');
        return response.data;
    },
};

export const analyticsApi = {
    getStats: async () => {
        const response = await api.get('/analytics');
        return response.data;
    },
};

export default api;
