import { Router } from 'express';
import AIAgentService from '../../services/AIAgentService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { message, context } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: 'Message is required' });
      return;
    }

    // Use authenticated wallet address
    const recommendation = await AIAgentService.getRecommendation(
      message,
      req.walletAddress,
      context
    );

    res.json({
      success: true,
      data: {
        response: recommendation,
        conversationId: context?.conversationId || `conv-${Date.now()}`,
        timestamp: Date.now(),
      },
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process chat message',
    });
  }
});

export default router;

