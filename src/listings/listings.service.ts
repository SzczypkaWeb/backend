import { Injectable } from '@nestjs/common';
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

    const [data, total] = await Promise.all([
      this.prisma.listing.findMany({
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.listing.count(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: total === 0 ? 0 : Math.ceil(total / limit),
    };
  }

  create(dto: CreateListingDto) {
    return this.prisma.listing.create({ data: dto });
  }
}
