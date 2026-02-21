import { BillingCycle } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum Currency {
  TRY = 'TRY',
  USD = 'USD',
  EUR = 'EUR',
}

export class CreateSubscriptionDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  planName?: string;

  @Type(() => Number)
  @IsNumber()
  amount!: number;

  @IsEnum(Currency)
  currency!: Currency;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsDateString()
  nextBillingDate!: string;

  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  autoRenew!: boolean;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  reminderDaysBefore?: number;
}
