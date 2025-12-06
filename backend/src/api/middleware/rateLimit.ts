import { Request, Response, NextFunction } from 'express';
import redisClient from '../../config/redis.js';

export const rateLimit = (maxRequests: number, windowMs: number) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `ratelimit:${req.ip}`;
    
    try {
      const current = await redisClient.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= maxRequests) {
        res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: windowMs / 1000,
        });
        return;
      }

      await redisClient.incr(key);
      await redisClient.expire(key, Math.floor(windowMs / 1000));

      next();
    } catch (error) {
      // If Redis fails, allow request (fail open)
      console.error('Rate limit error:', error);
      next();
    }
  };
};

