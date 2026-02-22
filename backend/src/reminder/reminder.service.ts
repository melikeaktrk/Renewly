import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const RENEWAL_REMINDER_TYPE = 'RENEWAL_REMINDER';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 * * *')
  async sendRenewalReminders() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        userId: true,
        name: true,
        nextBillingDate: true,
        reminderDaysBefore: true,
      },
    });

    const today = new Date();
    const todayStart = this.startOfDay(today);

    for (const subscription of subscriptions) {
      const reminderDate = this.startOfDay(subscription.nextBillingDate);
      reminderDate.setDate(
        reminderDate.getDate() - subscription.reminderDaysBefore,
      );

      if (!this.isSameDate(reminderDate, todayStart)) {
        continue;
      }

      const existingLog = await this.prisma.notificationLog.findUnique({
        where: {
          userId_subscriptionId_type_scheduledFor: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            type: RENEWAL_REMINDER_TYPE,
            scheduledFor: todayStart,
          },
        },
      });

      if (existingLog) {
        continue;
      }

      const message = `Reminder: ${subscription.name} will renew in ${subscription.reminderDaysBefore} days`;

      try {
        await this.prisma.notificationLog.create({
          data: {
            userId: subscription.userId,
            subscriptionId: subscription.id,
            type: RENEWAL_REMINDER_TYPE,
            message,
            scheduledFor: todayStart,
          },
        });

        console.log(message);
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        throw error;
      }
    }
  }

  private startOfDay(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private isSameDate(a: Date, b: Date) {
    return a.getTime() === b.getTime();
  }
}
