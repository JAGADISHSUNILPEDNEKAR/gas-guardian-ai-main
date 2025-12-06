import { Router } from 'express';
import AlertService from '../../services/AlertService.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import prisma from '../../config/database.js';

const router = Router();

// POST /api/alerts
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { alertType, condition, notificationChannels } = req.body;

    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const alert = await AlertService.createAlert(
      req.userId,
      alertType,
      condition,
      notificationChannels
    );

    res.json({
      success: true,
      data: alert,
    });
  } catch (error: any) {
    console.error('Create alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create alert',
    });
  }
});

// GET /api/alerts
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const alerts = await AlertService.getUserAlerts(req.userId);

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error: any) {
    console.error('Get alerts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch alerts',
    });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    // Verify ownership
    const alert = await prisma.alert.findUnique({
      where: { id },
    });

    if (!alert || alert.userId !== req.userId) {
      res.status(404).json({ success: false, error: 'Alert not found' });
      return;
    }

    await AlertService.deleteAlert(id);

    res.json({
      success: true,
      data: { message: 'Alert deleted' },
    });
  } catch (error: any) {
    console.error('Delete alert error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete alert',
    });
  }
});

export default router;

