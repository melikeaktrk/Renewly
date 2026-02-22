import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReminderService } from './reminder.service';

@Module({
  imports: [PrismaModule],
  providers: [ReminderService],
})
export class ReminderModule {}
