import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReminderService {
  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 0 * * *')
  async sendRenewalReminders() {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: {
        name: true,
        nextBillingDate: true,
        reminderDaysBefore: true,
      },
    });

    const today = new Date();

    for (const subscription of subscriptions) {
      const reminderDate = new Date(subscription.nextBillingDate);
      reminderDate.setDate(
        reminderDate.getDate() - subscription.reminderDaysBefore,
      );

      if (this.isSameDate(reminderDate, today)) {
        console.log(
          `Reminder: ${subscription.name} will renew in ${subscription.reminderDaysBefore} days`,
        );
      }
    }
  }

  private isSameDate(a: Date, b: Date) {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
