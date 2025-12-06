import { startGasPricePoller } from './gasPricePoller.js';
import { startAlertChecker } from './alertChecker.js';
import { startLeaderboardUpdater } from './leaderboardUpdater.js';
import { startFDCDataFetcher } from './fdcDataFetcher.js';
import { startModelTrainer } from './modelTrainer.js';

export const startAllJobs = () => {
  startGasPricePoller();
  startAlertChecker();
  startLeaderboardUpdater();
  startFDCDataFetcher();
  startModelTrainer();
  
  console.log('All background jobs started');
};

