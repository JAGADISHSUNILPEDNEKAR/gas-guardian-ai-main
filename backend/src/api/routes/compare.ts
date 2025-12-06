import { Router } from 'express';
import FDCService from '../../services/FDCService.js';
import FTSOv2Service from '../../services/FTSOv2Service.js';

const router = Router();

// POST /api/compare/deployment
router.post('/deployment', async (req, res) => {
  try {
    const { gasUnits, contractSize } = req.body;

    if (!gasUnits || !contractSize) {
      res.status(400).json({
        success: false,
        error: 'gasUnits and contractSize are required',
      });
      return;
    }

    const fdcService = new FDCService();
    const ftsoService = new FTSOv2Service();

    // Get cross-chain gas prices
    const crossChainGas = await fdcService.getCrossChainGasPrices();

    // Get price feeds for conversion
    const flrPrice = await ftsoService.getPrice('FLR/USD');
    const ethPrice = await ftsoService.getPrice('ETH/USD').catch(() => ({ price: 2500 })); // Fallback

    // Calculate costs for each chain
    const comparisons = [];

    // Flare
    if (crossChainGas.flare) {
      const costFlr = (gasUnits * crossChainGas.flare * 1e9) / 1e18;
      const costUsd = costFlr * flrPrice.price;
      comparisons.push({
        chain: 'Flare',
        gasPrice: crossChainGas.flare,
        costUsd: costUsd,
        time: '2s',
        recommendation: 'BEST_VALUE',
      });
    }

    // Ethereum
    if (crossChainGas.ethereum) {
      const costEth = (gasUnits * crossChainGas.ethereum * 1e9) / 1e18;
      const costUsd = costEth * (ethPrice as any).price;
      comparisons.push({
        chain: 'Ethereum',
        gasPrice: crossChainGas.ethereum,
        costUsd: costUsd,
        time: '12s',
        recommendation: costUsd > 50 ? 'TOO_EXPENSIVE' : 'MEDIUM',
      });
    }

    // Polygon
    if (crossChainGas.polygon) {
      const costMatic = (gasUnits * crossChainGas.polygon * 1e9) / 1e18;
      const maticPrice = await ftsoService.getPrice('MATIC/USD').catch(() => ({ price: 0.8 }));
      const costUsd = costMatic * maticPrice.price;
      comparisons.push({
        chain: 'Polygon',
        gasPrice: crossChainGas.polygon,
        costUsd: costUsd,
        time: '3s',
        recommendation: 'CHEAPEST',
      });
    }

    // Sort by cost
    comparisons.sort((a, b) => a.costUsd - b.costUsd);

    res.json({
      success: true,
      data: {
        comparisons,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Compare deployment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare deployment costs',
    });
  }
});

export default router;

