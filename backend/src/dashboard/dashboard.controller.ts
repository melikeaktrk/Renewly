import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { DashboardService } from './dashboard.service';
import { TopExpensiveQueryDto, UpcomingQueryDto } from './dto/dashboard-query.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Req() req: AuthenticatedRequest) {
    return this.dashboardService.getSummary(req.user.sub);
  }

  @Get('upcoming')
  getUpcoming(
    @Req() req: AuthenticatedRequest,
    @Query(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    query: UpcomingQueryDto,
  ) {
    return this.dashboardService.getUpcoming(req.user.sub, query.days ?? 7);
  }

  @Get('top-expensive')
  getTopExpensive(
    @Req() req: AuthenticatedRequest,
    @Query(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    query: TopExpensiveQueryDto,
  ) {
    return this.dashboardService.getTopExpensive(req.user.sub, query.limit ?? 5);
  }
}
