import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindUsersQueryDto = new FindUsersQueryDto()) {
    // Fall back to the DTO defaults in case an incomplete query object is
    // passed in directly (e.g. from a caller that bypassed the ValidationPipe).
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    // Trim defensively here too (in addition to the DTO's @Transform), in
    // case this is called with a query object that bypassed the
    // ValidationPipe, so a whitespace-only search never falls through as a
    // truthy filter.
    const search = query.search?.trim();

    const where = search
      ? { email: { contains: search, mode: 'insensitive' as const } }
      : undefined;

    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
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
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    // Ensure the user exists first so a PATCH on a missing id consistently
    // yields a 404 instead of a raw Prisma "record not found" error.
    await this.findOne(id);

    // `dto` only contains the fields explicitly provided by the client, each
    // set to a fixed value (no increment/append operations), so applying the
    // same PATCH body twice always converges to the same resource state.
    return this.prisma.user.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
