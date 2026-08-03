import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FindListingsQueryDto } from './dto/find-listings-query.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindListingsQueryDto = new FindListingsQueryDto()) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    let where: Prisma.ListingWhereInput | undefined;

    if (query.q && query.location) {
      where = {
        AND: [
          { title: { contains: query.q, mode: 'insensitive' } },
          { location: { contains: query.location, mode: 'insensitive' } },
        ],
      };
    } else if (query.q) {
      where = { title: { contains: query.q, mode: 'insensitive' } };
    } else if (query.location) {
      where = { location: { contains: query.location, mode: 'insensitive' } };
    }

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      where ? this.prisma.listing.count({ where }) : this.prisma.listing.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    try {
      return await this.prisma.listing.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  create(dto: CreateListingDto) {
    return this.prisma.listing.create({ data: dto });
  }

  async remove(id: string) {
    try {
      return await this.prisma.listing.delete({ where: { id } });
    } catch (error) {
      const prismaError = error as { code?: string };
      if (prismaError?.code === 'P2025') {
        throw new NotFoundException(`Listing with id ${id} not found`);
      }
      throw error;
    }
  }
}
