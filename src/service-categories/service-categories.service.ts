import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { FindServiceCategoriesQueryDto } from './dto/find-service-categories-query.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindServiceCategoriesQueryDto = new FindServiceCategoriesQueryDto()) {
    const where: Prisma.ServiceCategoryWhereInput = {
      parentId: query.parentId ?? null,
    };

    return this.prisma.serviceCategory.findMany({
      where,
    });
  }

  async findOne(id: string) {
    return this.prisma.serviceCategory.findUnique({
      where: { id },
    });
  }

  async create(dto: CreateServiceCategoryDto) {
    try {
      return await this.prisma.serviceCategory.create({
        data: dto,
      });
    } catch (error) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };

      if (prismaError?.code === 'P2002') {
        // Unique constraint violation - slug already exists
        throw new ConflictException('A category with this slug already exists');
      }

      if (prismaError?.code === 'P2025') {
        // Parent category not found
        throw new BadRequestException('Parent category does not exist');
      }

      throw error;
    }
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    try {
      return await this.prisma.serviceCategory.update({
        where: { id },
        data: dto,
      });
    } catch (error) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };

      if (prismaError?.code === 'P2025') {
        throw new NotFoundException(`Category with id ${id} not found`);
      }

      if (prismaError?.code === 'P2002') {
        // Unique constraint violation - slug already exists
        throw new ConflictException('A category with this slug already exists');
      }

      throw error;
    }
  }

  async delete(id: string) {
    try {
      return await this.prisma.serviceCategory.delete({
        where: { id },
      });
    } catch (error) {
      const prismaError = error as { code?: string; meta?: { relation_name?: string } };

      if (prismaError?.code === 'P2025') {
        throw new NotFoundException(`Category with id ${id} not found`);
      }

      if (prismaError?.code === 'P2014') {
        // Foreign key constraint - category is referenced by other records
        throw new ConflictException(
          'Cannot delete this category because it is referenced by providers or service requests',
        );
      }

      throw error;
    }
  }
}
