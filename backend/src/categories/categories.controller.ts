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
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { IdParamDto } from '../common/dto/id-param.dto';

interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.categoriesService.findAll(req.user.sub);
  }

  @Post()
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: CreateCategoryDto,
  ) {
    return this.categoriesService.create(req.user.sub, body);
  }

  @Put(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: IdParamDto,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    body: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(req.user.sub, params.id, body);
  }

  @Delete(':id')
  remove(
    @Req() req: AuthenticatedRequest,
    @Param(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    params: IdParamDto,
  ) {
    return this.categoriesService.remove(req.user.sub, params.id);
  }
}
