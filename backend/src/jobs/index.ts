import { startGasPricePoller } from './gasPricePoller.js';
import { startAlertChecker } from './alertChecker.js';
import { startLeaderboardUpdater } from './leaderboardUpdater.js';
import { startFDCDataFetcher } from './fdcDataFetcher.js';
import { startModelTrainer } from './modelTrainer.js';

// Check if Redis is enabled
const isRedisEnabled = () => {
  const redisUrl = process.env.REDIS_URL;
  return redisUrl && 
         redisUrl.trim() !== '' && 
         redisUrl !== 'redis://localhost:6379' &&
         redisUrl.toLowerCase() !== 'false' &&
         redisUrl.toLowerCase() !== 'no';
};

export const startAllJobs = () => {
  // Only start jobs that require Redis if Redis is enabled
  if (isRedisEnabled()) {
    startGasPricePoller();
    startAlertChecker();
    startLeaderboardUpdater();
    startFDCDataFetcher();
    startModelTrainer();
    console.log('✅ All background jobs started (Redis enabled)');
  } else {
    console.log('ℹ️  Background jobs skipped (Redis disabled - this is fine for development)');
  }
};

