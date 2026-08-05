import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FindUsersQueryDto } from './dto/find-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$mocked$hash'),
}));

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('forwards the (already validated/transformed) query DTO to the service', async () => {
      const query: FindUsersQueryDto = { page: 2, limit: 5 };
      const paginated = { data: [], total: 0, page: 2, limit: 5, totalPages: 0 };
      usersService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(query);

      expect(usersService.findAll).toHaveBeenCalledWith(query);
      expect(usersService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginated);
    });

    it('forwards the search filter to the service', async () => {
      const query: FindUsersQueryDto = { page: 1, limit: 10, search: 'example.com' };
      const user = { id: '1', email: 'a@example.com', createdAt: new Date() };
      const paginated = { data: [user], total: 1, page: 1, limit: 10, totalPages: 1 };
      usersService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(query);

      expect(usersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    it('returns the user when found', async () => {
      const id = 'user-123';
      const user = { id, email: 'test@example.com', createdAt: new Date() };
      usersService.findOne.mockResolvedValue(user);

      const result = await controller.findOne(id);

      expect(usersService.findOne).toHaveBeenCalledWith(id);
      expect(usersService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(user);
    });

    it('propagates NotFoundException when the user does not exist', async () => {
      const id = 'missing-id';
      usersService.findOne.mockRejectedValue(new NotFoundException(`User with id ${id} not found`));

      await expect(controller.findOne(id)).rejects.toThrow(NotFoundException);
      expect(usersService.findOne).toHaveBeenCalledWith(id);
    });
  });

  describe('update', () => {
    it('calls usersService.update with the provided id and dto, and returns the same result for identical calls', async () => {
      const id = 'user-123';
      const dto: UpdateUserDto = { email: 'new@example.com' };
      const updatedUser = { id, email: dto.email, createdAt: new Date() };
      usersService.update.mockResolvedValue(updatedUser);

      const first = await controller.update(id, dto);
      const second = await controller.update(id, dto);

      expect(first).toEqual(updatedUser);
      expect(second).toEqual(updatedUser);
      expect(first).toEqual(second);
      expect(usersService.update).toHaveBeenNthCalledWith(1, id, dto);
      expect(usersService.update).toHaveBeenNthCalledWith(2, id, dto);
      expect(usersService.update).toHaveBeenCalledTimes(2);
    });

    it('propagates NotFoundException when the user does not exist', async () => {
      const id = 'missing-id';
      const dto: UpdateUserDto = { email: 'new@example.com' };
      usersService.update.mockRejectedValue(new NotFoundException(`User with id ${id} not found`));

      await expect(controller.update(id, dto)).rejects.toThrow(NotFoundException);
      expect(usersService.update).toHaveBeenCalledWith(id, dto);
    });
  });

  describe('remove', () => {
    it('calls usersService.remove with the provided id', async () => {
      const id = 'user-123';

      await controller.remove(id);

      expect(usersService.remove).toHaveBeenCalledWith(id);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
