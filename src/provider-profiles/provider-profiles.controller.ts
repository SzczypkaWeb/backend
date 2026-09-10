import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ProviderProfilesService } from './provider-profiles.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddProviderCategoryDto } from './dto/add-provider-category.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

@Controller('provider-profiles')
export class ProviderProfilesController {
  constructor(private readonly providerProfilesService: ProviderProfilesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: RequestWithUser, @Body() dto: CreateProviderProfileDto) {
    return this.providerProfilesService.create(req.user.userId, dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getOwn(@Req() req: RequestWithUser) {
    return this.providerProfilesService.getOwn(req.user.userId);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateOwn(@Req() req: RequestWithUser, @Body() dto: UpdateProviderProfileDto) {
    return this.providerProfilesService.updateOwn(req.user.userId, dto);
  }

  @Post('me/categories')
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  addCategory(@Req() req: RequestWithUser, @Body() dto: AddProviderCategoryDto) {
    return this.providerProfilesService.addCategory(req.user.userId, dto.categoryId);
  }

  @Delete('me/categories/:categoryId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  removeCategory(@Req() req: RequestWithUser, @Param('categoryId') categoryId: string) {
    return this.providerProfilesService.removeCategory(req.user.userId, categoryId);
  }
}
