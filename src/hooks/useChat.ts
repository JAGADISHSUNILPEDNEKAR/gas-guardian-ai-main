import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

interface ChatResponse {
  recommendation: 'EXECUTE_NOW' | 'WAIT' | 'SCHEDULE';
  reasoning: string;
  currentConditions: any;
  prediction?: any;
  savings?: any;
  actions: any[];
}

export function useChat() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const sendMessage = async (
    message: string,
    walletAddress?: string,
    context?: any
  ): Promise<ChatResponse> => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/chat`,
        {
          message,
          walletAddress,
          context: context || { conversationId },
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (response.data.success) {
        const data = response.data.data;
        if (data.conversationId) {
          setConversationId(data.conversationId);
        }
        return data.response;
      } else {
        throw new Error(response.data.error || 'Failed to get response');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    loading,
    error,
    conversationId,
  };
}

