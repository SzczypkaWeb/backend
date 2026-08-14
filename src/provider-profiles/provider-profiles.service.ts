import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';

@Injectable()
export class ProviderProfilesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProviderProfileDto) {
    try {
      return await this.prisma.providerProfile.create({
        data: {
          userId,
          ...dto,
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string; meta?: { target?: string[] } };

      if (prismaError?.code === 'P2002') {
        // Unique constraint violation - user already has a profile
        throw new ConflictException('User already has a provider profile');
      }

      throw error;
    }
  }

  async getOwn(userId: string) {
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
      include: { categories: { include: { category: true } } },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    return profile;
  }

  async updateOwn(userId: string, dto: UpdateProviderProfileDto) {
    try {
      return await this.prisma.providerProfile.update({
        where: { userId },
        data: dto,
        include: { categories: { include: { category: true } } },
      });
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError?.code === 'P2025') {
        throw new NotFoundException('Provider profile not found');
      }

      throw error;
    }
  }

  async addCategory(userId: string, categoryId: string) {
    // Check if profile exists
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    // Check if category exists
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    // Add category to profile
    try {
      await this.prisma.providerCategory.create({
        data: {
          providerId: profile.id,
          categoryId,
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError?.code === 'P2002') {
        throw new ConflictException('Category already added to provider');
      }

      throw error;
    }
  }

  async removeCategory(userId: string, categoryId: string) {
    // Check if profile exists
    const profile = await this.prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new NotFoundException('Provider profile not found');
    }

    // Remove category from profile
    try {
      await this.prisma.providerCategory.delete({
        where: {
          providerId_categoryId: {
            providerId: profile.id,
            categoryId,
          },
        },
      });
    } catch (error) {
      const prismaError = error as { code?: string };

      if (prismaError?.code === 'P2025') {
        throw new NotFoundException('Category not found in provider profile');
      }

      throw error;
    }
  }
}
