import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: string) {
    return this.prisma.subscription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateSubscriptionDto) {
    await this.assertCategoryOwnership(userId, dto.categoryId);

    return this.prisma.subscription.create({
      data: {
        userId,
        name: dto.name,
        planName: dto.planName,
        amount: dto.amount,
        currency: dto.currency,
        billingCycle: dto.billingCycle,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        nextBillingDate: new Date(dto.nextBillingDate),
        autoRenew: dto.autoRenew,
        categoryId: dto.categoryId,
        notes: dto.notes,
        reminderDaysBefore: dto.reminderDaysBefore ?? 3,
      },
    });
  }

  async findOne(userId: string, id: string) {
    return this.findOwnedOrThrow(userId, id);
  }

  async update(userId: string, id: string, dto: UpdateSubscriptionDto) {
    await this.findOwnedOrThrow(userId, id);
    await this.assertCategoryOwnership(userId, dto.categoryId);

    return this.prisma.subscription.update({
      where: { id },
      data: {
        name: dto.name,
        planName: dto.planName,
        amount: dto.amount,
        currency: dto.currency,
        billingCycle: dto.billingCycle,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        nextBillingDate: dto.nextBillingDate
          ? new Date(dto.nextBillingDate)
          : undefined,
        autoRenew: dto.autoRenew,
        categoryId: dto.categoryId,
        notes: dto.notes,
        reminderDaysBefore: dto.reminderDaysBefore,
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOwnedOrThrow(userId, id);

    return this.prisma.subscription.delete({
      where: { id },
    });
  }

  private async findOwnedOrThrow(userId: string, id: string) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { id, userId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    return subscription;
  }

  private async assertCategoryOwnership(userId: string, categoryId?: string | null) {
    if (!categoryId) {
      return;
    }

    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }
  }
}
