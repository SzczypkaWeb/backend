import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  create(dto: CreateUserDto) {
    return this.prisma.user.create({ data: dto });
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
