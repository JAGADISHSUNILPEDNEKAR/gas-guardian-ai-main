import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let isRedisEnabled = false;

// Check if Redis URL is provided and valid
const redisUrl = process.env.REDIS_URL;

// Only initialize Redis if URL is explicitly provided AND not empty AND not default localhost
// If REDIS_URL is empty, undefined, or default localhost, Redis will be completely disabled
const shouldUseRedis = redisUrl && 
                       redisUrl.trim() !== '' && 
                       redisUrl !== 'redis://localhost:6379' &&
                       redisUrl.toLowerCase() !== 'false' &&
                       redisUrl.toLowerCase() !== 'no';

if (shouldUseRedis) {
  try {
    redisClient = createClient({
      url: redisUrl,
    });

    redisClient.on('error', (err) => {
      console.warn('Redis Client Error (continuing without Redis):', err.message);
      isRedisEnabled = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis Client Connected');
      isRedisEnabled = true;
    });

    // Connect on initialization (non-blocking)
    redisClient.connect().catch((err) => {
      console.warn('⚠️  Redis connection failed (continuing without Redis):', err.message);
      isRedisEnabled = false;
      redisClient = null;
    });
  } catch (error) {
    console.warn('⚠️  Redis initialization failed (continuing without Redis)');
    redisClient = null;
    isRedisEnabled = false;
  }
} else {
  // Redis completely disabled
  console.log('ℹ️  Redis disabled - running without cache (this is fine for development)');
  isRedisEnabled = false;
  redisClient = null;
}

// Wrapper functions with fallback
const redisWrapper = {
  async get(key: string): Promise<string | null> {
    if (!isRedisEnabled || !redisClient) return null;
    try {
      return await redisClient.get(key);
    } catch (error) {
      console.warn('Redis get error:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    if (!isRedisEnabled || !redisClient) return;
    try {
      await redisClient.set(key, value);
    } catch (error) {
      console.warn('Redis set error:', error);
    }
  },

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    if (!isRedisEnabled || !redisClient) return;
    try {
      await redisClient.setEx(key, seconds, value);
    } catch (error) {
      console.warn('Redis setEx error:', error);
    }
  },

  async del(key: string): Promise<void> {
    if (!isRedisEnabled || !redisClient) return;
    try {
      await redisClient.del(key);
    } catch (error) {
      console.warn('Redis del error:', error);
    }
  },

  async incr(key: string): Promise<number> {
    if (!isRedisEnabled || !redisClient) return 0;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.warn('Redis incr error:', error);
      return 0;
    }
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (!isRedisEnabled || !redisClient) return;
    try {
      await redisClient.expire(key, seconds);
    } catch (error) {
      console.warn('Redis expire error:', error);
    }
  },

  isConnected(): boolean {
    return isRedisEnabled && redisClient !== null;
  },
};

export default redisWrapper;

