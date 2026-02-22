import { BillingCycle } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
      select: { amount: true, billingCycle: true },
    });

    const totals = subscriptions.reduce(
      (acc, subscription) => {
        const amount = Number(subscription.amount);

        if (subscription.billingCycle === BillingCycle.YEARLY) {
          acc.monthlyTotal += amount / 12;
          acc.yearlyTotal += amount;
        } else {
          acc.monthlyTotal += amount;
          acc.yearlyTotal += amount * 12;
        }

        return acc;
      },
      { monthlyTotal: 0, yearlyTotal: 0 },
    );

    return {
      monthlyTotal: Number(totals.monthlyTotal.toFixed(2)),
      yearlyTotal: Number(totals.yearlyTotal.toFixed(2)),
    };
  }

  getUpcoming(userId: string, days = 7) {
    const now = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return this.prisma.subscription.findMany({
      where: {
        userId,
        nextBillingDate: {
          gte: now,
          lte: endDate,
        },
      },
      orderBy: {
        nextBillingDate: 'asc',
      },
    });
  }

  async getTopExpensive(userId: string, limit = 5) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { userId },
    });

    return subscriptions
      .sort((a, b) => this.monthlyNormalized(b) - this.monthlyNormalized(a))
      .slice(0, limit);
  }

  private monthlyNormalized(subscription: {
    amount: { toNumber(): number };
    billingCycle: BillingCycle;
  }) {
    const amount = Number(subscription.amount);
    return subscription.billingCycle === BillingCycle.MONTHLY
      ? amount
      : amount / 12;
  }
}
