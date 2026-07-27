import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  const usersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
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

  describe('remove', () => {
    it('calls usersService.remove with the provided id', async () => {
      const id = 'user-123';

      await controller.remove(id);

      expect(usersService.remove).toHaveBeenCalledWith(id);
      expect(usersService.remove).toHaveBeenCalledTimes(1);
    });
  });
});
