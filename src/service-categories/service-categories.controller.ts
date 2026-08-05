import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { FindServiceCategoriesQueryDto } from './dto/find-service-categories-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth/jwt-auth.guard';

@Controller('categories')
export class ServiceCategoriesController {
  constructor(private readonly serviceCategoriesService: ServiceCategoriesService) {}

  @Get()
  findAll(@Query() query: FindServiceCategoriesQueryDto) {
    return this.serviceCategoriesService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const category = await this.serviceCategoriesService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }
    return category;
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateServiceCategoryDto) {
    // TODO: Restrict to admin users once role-based access control is implemented.
    // For now, any authenticated user can create categories as a placeholder.
    return this.serviceCategoriesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
    // TODO: Restrict to admin users once role-based access control is implemented.
    // For now, any authenticated user can update categories as a placeholder.
    return this.serviceCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  delete(@Param('id') id: string) {
    // TODO: Restrict to admin users once role-based access control is implemented.
    // For now, any authenticated user can delete categories as a placeholder.
    return this.serviceCategoriesService.delete(id);
  }
}
