import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FindListingsQueryDto } from './dto/find-listings-query.dto';

@Injectable()
export class ListingsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindListingsQueryDto = new FindListingsQueryDto()) {
    // Fall back to the DTO defaults in case an incomplete query object is
    // passed in directly (e.g. from a caller that bypassed the ValidationPipe).
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    // Build the where clause for filtering

    let where: any;

    // If both filters are provided, use AND to combine them
    if (query.q && query.location) {
      where = {
        AND: [
          {
            title: {
              contains: query.q,
              mode: 'insensitive',
            },
          },
          {
            location: {
              contains: query.location,
              mode: 'insensitive',
            },
          },
        ],
      };
    } else if (query.q) {
      // Apply search filter on title if q is provided

      where = {
        title: {
          contains: query.q,
          mode: 'insensitive',
        },
      };
    } else if (query.location) {
      // Apply location filter if location is provided

      where = {
        location: {
          contains: query.location,
          mode: 'insensitive',
        },
      };
    }

    const findManyArgs: any = {
      skip: (page - 1) * limit,
      take: limit,
    };

    if (where) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
      findManyArgs.where = where;
    }

    const [data, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.prisma.listing.findMany(findManyArgs),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
