import nodemailer from 'nodemailer';
import prisma from '../config/database.js';

interface NotificationChannels {
  browser?: boolean;
  email?: boolean;
  telegram?: boolean;
  discord?: boolean;
}

export class NotificationService {
  private emailTransporter: nodemailer.Transporter | null = null;

  constructor() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      this.emailTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async sendAlert(user: any, message: string, channels: NotificationChannels): Promise<void> {
    const promises: Promise<any>[] = [];

    if (channels.email && user.email && this.emailTransporter) {
      promises.push(this.sendEmail(user.email, 'GasGuard Alert', message));
    }

    if (channels.telegram && process.env.TELEGRAM_BOT_TOKEN) {
      promises.push(this.sendTelegram(user.telegramChatId, message));
    }

    if (channels.discord && process.env.DISCORD_WEBHOOK_URL) {
      promises.push(this.sendDiscord(message));
    }

    // Browser notifications are handled client-side via WebSocket
    // Store notification in DB for browser clients to fetch
    if (channels.browser) {
      promises.push(
        prisma.notification.create({
          data: {
            userId: user.id,
            type: 'ALERT',
            message,
            read: false,
          },
        })
      );
    }

    await Promise.allSettled(promises);
  }

  async sendTransactionUpdate(user: any, transaction: any, status: string): Promise<void> {
    const message = `Transaction ${transaction.executionId.slice(0, 10)}... ${status}`;

    const channels: NotificationChannels = user.notificationPreferences || { browser: true };

    await this.sendAlert(user, message, channels);
  }

  private async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (!this.emailTransporter) {
      throw new Error('Email transporter not configured');
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text,
        html: `<p>${text}</p>`,
      });
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  private async sendTelegram(chatId: string | null, message: string): Promise<void> {
    if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) {
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending Telegram message:', error);
      throw error;
    }
  }

  private async sendDiscord(message: string): Promise<void> {
    if (!process.env.DISCORD_WEBHOOK_URL) {
      return;
    }

    try {
      const response = await fetch(process.env.DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord webhook error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending Discord message:', error);
      throw error;
    }
  }

  async getUnreadNotifications(userId: string): Promise<any[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });
  }

  async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }
}

export default new NotificationService();

