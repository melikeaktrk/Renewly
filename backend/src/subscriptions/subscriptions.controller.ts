import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';
import { IdParamDto } from '../common/dto/id-param.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.findAll(req.user.sub);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: CreateSubscriptionDto,
  ) {
    return this.subscriptionsService.create(req.user.sub, body);
  }

  @Get(':id')
  findOne(
    @Req() req: AuthenticatedRequest,
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: IdParamDto,
  ) {
    return this.subscriptionsService.findOne(req.user.sub, params.id);
  }

  @Put(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: IdParamDto,
    @Body(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    )
    body: UpdateSubscriptionDto,
  ) {
    return this.subscriptionsService.update(req.user.sub, params.id, body);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: IdParamDto,
  ) {
    return this.subscriptionsService.remove(req.user.sub, params.id);
  }
}
