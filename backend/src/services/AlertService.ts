import prisma from '../config/database.js';
import { GasOracleService } from './GasOracleService.js';
import { FTSOv2Service } from './FTSOv2Service.js';
import { NotificationService } from './NotificationService.js';

interface AlertCondition {
  type: 'gas_price' | 'asset_price' | 'congestion';
  operator: 'lt' | 'lte' | 'gt' | 'gte' | 'eq';
  value: number;
}

export class AlertService {
  private gasOracle = new GasOracleService();
  private ftsoService = new FTSOv2Service();
  private notificationService = new NotificationService();

  async createAlert(
    userId: string,
    alertType: string,
    condition: AlertCondition,
    notificationChannels: any
  ) {
    return prisma.alert.create({
      data: {
        userId,
        alertType,
        condition: condition as any,
        notificationChannels: notificationChannels || { browser: true },
        status: 'ACTIVE',
      },
    });
  }

  async updateAlert(alertId: string, updates: any) {
    return prisma.alert.update({
      where: { id: alertId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });
  }

  async deleteAlert(alertId: string) {
    return prisma.alert.update({
      where: { id: alertId },
      data: { status: 'DELETED' },
    });
  }

  async getUserAlerts(userId: string) {
    return prisma.alert.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async checkAlerts(): Promise<void> {
    const activeAlerts = await prisma.alert.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
    });

    for (const alert of activeAlerts) {
      try {
        const triggered = await this.evaluateCondition(alert.condition as AlertCondition);

        if (triggered) {
          // Check rate limiting (max 10/day)
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const todayTriggers = await prisma.alertTrigger.count({
            where: {
              alertId: alert.id,
              triggeredAt: {
                gte: today,
              },
            },
          });

          if (todayTriggers < 10) {
            // Trigger alert
            await this.triggerAlert(alert);
          }
        }
      } catch (error) {
        console.error(`Error checking alert ${alert.id}:`, error);
      }
    }
  }

  private async evaluateCondition(condition: AlertCondition): Promise<boolean> {
    switch (condition.type) {
      case 'gas_price': {
        const current = await this.gasOracle.getCurrentGas();
        return this.compare(current.gwei, condition.operator, condition.value);
      }

      case 'asset_price': {
        const price = await this.ftsoService.getPrice('FLR/USD');
        return this.compare(price.price, condition.operator, condition.value);
      }

      case 'congestion': {
        const congestion = await this.gasOracle.getCongestionLevel();
        return this.compare(congestion, condition.operator, condition.value);
      }

      default:
        return false;
    }
  }

  private compare(value: number, operator: string, target: number): boolean {
    switch (operator) {
      case 'lt':
        return value < target;
      case 'lte':
        return value <= target;
      case 'gt':
        return value > target;
      case 'gte':
        return value >= target;
      case 'eq':
        return Math.abs(value - target) < 0.01;
      default:
        return false;
    }
  }

  private async triggerAlert(alert: any): Promise<void> {
    const condition = alert.condition as AlertCondition;
    let message = '';

    switch (condition.type) {
      case 'gas_price': {
        const current = await this.gasOracle.getCurrentGas();
        message = `Gas price is now ${current.gwei} Gwei (target: ${condition.operator} ${condition.value})`;
        break;
      }
      case 'asset_price': {
        const price = await this.ftsoService.getPrice('FLR/USD');
        message = `FLR price is now $${price.price.toFixed(4)} (target: ${condition.operator} $${condition.value})`;
        break;
      }
      case 'congestion': {
        const congestion = await this.gasOracle.getCongestionLevel();
        message = `Network congestion is now ${congestion}% (target: ${condition.operator} ${condition.value}%)`;
        break;
      }
    }

    // Send notifications
    const channels = alert.notificationChannels || { browser: true };
    await this.notificationService.sendAlert(alert.user, message, channels);

    // Record trigger
    await prisma.alertTrigger.create({
      data: {
        alertId: alert.id,
        triggeredAt: new Date(),
      },
    });

    // Update alert
    await prisma.alert.update({
      where: { id: alert.id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: 1 },
      },
    });
  }
}

export default new AlertService();

