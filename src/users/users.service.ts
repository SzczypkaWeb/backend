import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { sanitizeUser } from './sanitize-user';
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
      data: data.map(sanitizeUser),
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

    return sanitizeUser(user);
  }

  // Internal lookup used by AuthService to verify credentials - intentionally
  // NOT sanitized, since the caller needs the passwordHash. Never return this
  // result directly to a client.
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(dto: CreateUserDto) {
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        // Explicit rather than relying on the schema's column default, so
        // this stays correct even if that default is ever changed for
        // other call sites (e.g. Google signup, see AuthService).
        authProvider: 'email',
      },
    });
    return sanitizeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    // Ensure the user exists first so a PATCH on a missing id consistently
    // yields a 404 instead of a raw Prisma "record not found" error.
    await this.findOne(id);

    // `dto` only contains the fields explicitly provided by the client, each
    // set to a fixed value (no increment/append operations), so applying the
    // same PATCH body twice always converges to the same resource state.
    const user = await this.prisma.user.update({ where: { id }, data: dto });
    return sanitizeUser(user);
  }

  async remove(id: string) {
    const user = await this.prisma.user.delete({ where: { id } });
    return sanitizeUser(user);
  }

  // One-off backfill for a marketplace-schema migration that added
  // `authProvider` with a hard DB-level default of 'email': every
  // pre-existing Google-only account (googleId set, no passwordHash) was
  // mislabeled as 'email' instead of 'google'. Accounts that *linked* Google
  // to an existing email/password signup (googleId set AND passwordHash set)
  // are intentionally left alone - `email` correctly reflects how those were
  // originally created.
  //
  // Safe to run more than once (idempotent): once corrected, rows no longer
  // match the `authProvider: 'email'` condition. See the corresponding SQL
  // data migration for the automatic one-time fix applied to existing
  // databases; this method exists so the same logic can also be re-run
  // on-demand (e.g. via a manual script) and is covered by tests.
  async backfillGoogleAuthProvider(): Promise<number> {
    const { count } = await this.prisma.user.updateMany({
      where: {
        googleId: { not: null },
        passwordHash: null,
        authProvider: 'email',
      },
      data: { authProvider: 'google' },
    });
    return count;
  }
}
