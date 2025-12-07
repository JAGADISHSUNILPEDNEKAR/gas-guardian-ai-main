import { Router } from 'express';
import { GasOracleService } from '../../services/GasOracleService.js';
import { FTSOv2Service } from '../../services/FTSOv2Service.js';
import { PredictionEngine } from '../../services/PredictionEngine.js';
import { PythonGasMonitorService } from '../../services/PythonGasMonitorService.js';

const router = Router();

// GET /api/gas/current
router.get('/current', async (req, res) => {
  try {
    const gasOracle = new GasOracleService();
    const ftsoService = new FTSOv2Service();
    const pythonMonitor = new PythonGasMonitorService();

    // Try to get gas price from Python monitor first, fallback to GasOracleService
    let currentGas;
    let gasSource = 'blockchain';
    
    const pythonGas = pythonMonitor.getCurrentGas();
    if (pythonGas) {
      currentGas = {
        gwei: pythonGas.gwei,
        wei: pythonGas.wei,
        timestamp: pythonGas.timestamp,
      };
      gasSource = 'python_monitor';
      console.log('Using Python monitor gas data:', currentGas.gwei, 'Gwei');
    } else {
      currentGas = await gasOracle.getCurrentGas();
      console.log('Using blockchain gas data:', currentGas.gwei, 'Gwei');
    }

    const flrPrice = await ftsoService.getPrice('FLR/USD');
    const congestion = await gasOracle.getCongestionLevel();

    const gasPriceUSD = currentGas.gwei * 0.000000001 * 21000 * flrPrice.price;

    // Determine status
    let status = 'LOW';
    if (currentGas.gwei > 40) status = 'HIGH';
    else if (currentGas.gwei > 20) status = 'MEDIUM';

    // Determine trend (simplified)
    const history = await gasOracle.getHistoricalGasPrices(1);
    const trend = history.length > 0 && history[history.length - 1].gasPrice < currentGas.gwei ? 'RISING' : 'FALLING';

    res.json({
      success: true,
      data: {
        gasPrice: {
          gwei: currentGas.gwei,
          wei: currentGas.wei,
        },
        prices: {
          flr: currentGas.gwei * 0.000000001 * 21000,
          usd: gasPriceUSD,
        },
        network: {
          congestion,
          blockNumber: await gasOracle['provider'].getBlockNumber(),
          blockTime: 12,
        },
        ftsoPrice: {
          flr: flrPrice.price,
          timestamp: flrPrice.timestamp,
        },
        status,
        trend,
        source: gasSource, // Indicate data source
      },
    });
  } catch (error: any) {
    console.error('Gas current error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch gas data',
    });
  }
});

// GET /api/gas/history
router.get('/history', async (req, res) => {
  try {
    const gasOracle = new GasOracleService();
    const history = await gasOracle.getHistoricalGasPrices(24); // 24 hours

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    console.error('Gas history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch gas history',
    });
  }
});

// GET /api/gas/predictions
router.get('/predictions', async (req, res) => {
  try {
    const predictionEngine = new PredictionEngine();
    const predictions = await predictionEngine.getPredictions();

    res.json({
      success: true,
      data: predictions,
    });
  } catch (error: any) {
    console.error('Predictions error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch predictions',
    });
  }
});

export default router;

