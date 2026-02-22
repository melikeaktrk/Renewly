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
    // TODO: REMOVE AFTER TESTING
    console.log(
      '[Reminder] tick',
      new Date().toISOString(),
      'env=',
      process.env.NODE_ENV,
    );
    await this.runReminderCheck();
  }

  private async runReminderCheck() {
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

    const today = this.startOfDay(new Date());

    for (const subscription of subscriptions) {
      const reminderDate = this.startOfDay(subscription.nextBillingDate);
      reminderDate.setDate(
        reminderDate.getDate() - subscription.reminderDaysBefore,
      );
      const reminderDay = this.startOfDay(reminderDate);

      if (reminderDay.getTime() === today.getTime()) {
        const existingLog = await this.prisma.notificationLog.findUnique({
          where: {
            userId_subscriptionId_type_scheduledFor: {
              userId: subscription.userId,
              subscriptionId: subscription.id,
              type: RENEWAL_REMINDER_TYPE,
              scheduledFor: today,
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
              scheduledFor: this.startOfDay(today),
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
  }

  private startOfDay(date: Date) {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  }

  private isSameDay(a: Date, b: Date) {
    return a.getTime() === b.getTime();
  }
}
