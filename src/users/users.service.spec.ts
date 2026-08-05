import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$mocked$hash'),
}));

// Import the mocked argon2 for use in tests
const argon2 = jest.requireMock<{ hash: jest.Mock }>('argon2');

describe('UsersService', () => {
  let service: UsersService;
  const prismaService = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('applies the default pagination (page 1, limit 10) when no query is given', async () => {
      const users = [{ id: '1', email: 'a@example.com', createdAt: new Date() }];
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.user.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({ where: undefined });
      expect(result).toEqual({ data: users, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('computes skip/take from the requested page and limit', async () => {
      const users = [{ id: '3', email: 'c@example.com', createdAt: new Date() }];
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.user.count.mockResolvedValue(25);
      const query: FindUsersQueryDto = { page: 3, limit: 10 };

      const result = await service.findAll(query);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({ data: users, total: 25, page: 3, limit: 10, totalPages: 3 });
    });

    it('filters by a case-insensitive partial email match when search is provided', async () => {
      const users = [{ id: '2', email: 'test@example.com', createdAt: new Date() }];
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.user.count.mockResolvedValue(1);
      const query: FindUsersQueryDto = { page: 1, limit: 10, search: 'TEST' };

      const result = await service.findAll(query);

      const expectedWhere = { email: { contains: 'TEST', mode: 'insensitive' } };
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 10,
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({ where: expectedWhere });
      expect(result).toEqual({ data: users, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('trims surrounding whitespace from the search value before querying', async () => {
      const users = [{ id: '2', email: 'test@example.com', createdAt: new Date() }];
      prismaService.user.findMany.mockResolvedValue(users);
      prismaService.user.count.mockResolvedValue(1);
      const query: FindUsersQueryDto = { page: 1, limit: 10, search: '  TEST  ' };

      await service.findAll(query);

      const expectedWhere = { email: { contains: 'TEST', mode: 'insensitive' } };
      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: expectedWhere,
        skip: 0,
        take: 10,
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('treats a whitespace-only search as no filter', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);
      const query: FindUsersQueryDto = { page: 1, limit: 10, search: '   ' };

      await service.findAll(query);

      expect(prismaService.user.findMany).toHaveBeenCalledWith({
        where: undefined,
        skip: 0,
        take: 10,
      });
      expect(prismaService.user.count).toHaveBeenCalledWith({ where: undefined });
    });

    it('returns 0 total pages when there are no matching results', async () => {
      prismaService.user.findMany.mockResolvedValue([]);
      prismaService.user.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10, search: 'nobody' });

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    });
  });

  describe('findOne', () => {
    it('returns the user when it exists', async () => {
      const id = 'user-123';
      const user = { id, email: 'test@example.com', createdAt: new Date() };
      prismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findOne(id);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(result).toEqual(user);
    });

    it('throws NotFoundException when the user does not exist', async () => {
      const id = 'missing-id';
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('create', () => {
    it('hashes the password and creates a user with the hashed password', async () => {
      const dto = { email: 'new@example.com', password: 'plain-password' };
      const mockHash = '$argon2id$v=19$m=65536,t=3,p=4$mocked$hash';
      const createdUser = {
        id: 'user-new',
        email: dto.email,
        passwordHash: mockHash,
        createdAt: new Date(),
      };

      argon2.hash.mockResolvedValue(mockHash);
      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(dto);

      expect(argon2.hash).toHaveBeenCalledWith(dto.password);
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { email: dto.email, passwordHash: mockHash },
      });
      expect(result).toEqual(createdUser);
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found by email', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-123', email, passwordHash: 'hash' };
      prismaService.user.findUnique.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({ where: { email } });
      expect(result).toEqual(user);
    });

    it('returns null when user is not found by email', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('deletes a user by id', async () => {
      const id = 'user-123';
      const deletedUser = { id, email: 'test@example.com' };
      prismaService.user.delete.mockResolvedValue(deletedUser);

      const result = await service.remove(id);

      expect(prismaService.user.delete).toHaveBeenCalledWith({ where: { id } });
      expect(result).toEqual(deletedUser);
    });
  });

  describe('update', () => {
    it('is idempotent: sending the same PATCH body twice yields the same final state', async () => {
      const id = 'user-123';
      const existingUser = { id, email: 'old@example.com', createdAt: new Date('2024-01-01') };
      const dto: UpdateUserDto = { email: 'new@example.com' };

      // A minimal stateful fake so the test actually verifies the resulting
      // resource state, rather than just recording call arguments. If the
      // implementation ever used increment/append semantics instead of
      // overwriting with fixed values, applying the same PATCH twice would
      // produce a different second result and this test would catch it.
      let record = { ...existingUser };
      prismaService.user.findUnique.mockImplementation(() => Promise.resolve(record));
      prismaService.user.update.mockImplementation(({ data }: { data: UpdateUserDto }) => {
        record = { ...record, ...data };
        return Promise.resolve(record);
      });

      const first = await service.update(id, dto);
      const second = await service.update(id, dto);

      expect(first).toEqual(second);
      expect(record).toEqual({ ...existingUser, ...dto });
      expect(prismaService.user.update).toHaveBeenCalledTimes(2);
      expect(prismaService.user.update).toHaveBeenNthCalledWith(1, { where: { id }, data: dto });
      expect(prismaService.user.update).toHaveBeenNthCalledWith(2, { where: { id }, data: dto });
    });

    it('throws NotFoundException when the user does not exist', async () => {
      const id = 'missing-id';
      const dto: UpdateUserDto = { email: 'new@example.com' };
      prismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.update(id, dto)).rejects.toThrow(NotFoundException);
      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
