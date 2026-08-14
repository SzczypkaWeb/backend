import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProviderProfilesController } from './provider-profiles.controller';
import { ProviderProfilesService } from './provider-profiles.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AddProviderCategoryDto } from './dto/add-provider-category.dto';

describe('ProviderProfilesController', () => {
  let controller: ProviderProfilesController;
  const providerProfilesService = {
    create: jest.fn(),
    getOwn: jest.fn(),
    updateOwn: jest.fn(),
    addCategory: jest.fn(),
    removeCategory: jest.fn(),
  };

  const mockUser = { userId: 'user-123', email: 'test@example.com' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProviderProfilesController],
      providers: [{ provide: ProviderProfilesService, useValue: providerProfilesService }],
    }).compile();

    controller = module.get<ProviderProfilesController>(ProviderProfilesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('creates a new provider profile for the authenticated user', async () => {
      const dto: CreateProviderProfileDto = {
        nip: '1234567890',
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
        bio: 'Test bio',
      };

      const created = {
        id: 'profile-123',
        userId: 'user-123',
        ...dto,
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      providerProfilesService.create.mockResolvedValue(created);

      const result = await controller.create({ user: mockUser } as any, dto);

      expect(providerProfilesService.create).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(created);
    });

    it('throws ConflictException if user already has a profile', async () => {
      const dto: CreateProviderProfileDto = {
        nip: '1234567890',
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
      };

      providerProfilesService.create.mockRejectedValue(
        new ConflictException('User already has a provider profile'),
      );

      await expect(controller.create({ user: mockUser } as any, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getOwn', () => {
    it("returns the authenticated user's provider profile", async () => {
      const profile = {
        id: 'profile-123',
        userId: 'user-123',
        nip: '1234567890',
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
        bio: 'Test bio',
        verificationStatus: 'pending',
        categories: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      providerProfilesService.getOwn.mockResolvedValue(profile);

      const result = await controller.getOwn({ user: mockUser } as any);

      expect(providerProfilesService.getOwn).toHaveBeenCalledWith('user-123');
      expect(result).toEqual(profile);
    });

    it('throws NotFoundException if user has no provider profile', async () => {
      providerProfilesService.getOwn.mockRejectedValue(
        new NotFoundException('Provider profile not found'),
      );

      await expect(controller.getOwn({ user: mockUser } as any)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateOwn', () => {
    it("updates the authenticated user's provider profile", async () => {
      const dto: UpdateProviderProfileDto = {
        bio: 'Updated bio',
      };

      const updated = {
        id: 'profile-123',
        userId: 'user-123',
        nip: '1234567890',
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
        bio: 'Updated bio',
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      providerProfilesService.updateOwn.mockResolvedValue(updated);

      const result = await controller.updateOwn({ user: mockUser } as any, dto);

      expect(providerProfilesService.updateOwn).toHaveBeenCalledWith('user-123', dto);
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException if user has no provider profile', async () => {
      const dto: UpdateProviderProfileDto = { bio: 'Updated bio' };

      providerProfilesService.updateOwn.mockRejectedValue(
        new NotFoundException('Provider profile not found'),
      );

      await expect(controller.updateOwn({ user: mockUser } as any, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('addCategory', () => {
    it("adds a category to the user's profile", async () => {
      const dto: AddProviderCategoryDto = { categoryId: 'category-123' };

      providerProfilesService.addCategory.mockResolvedValue(undefined);

      await controller.addCategory({ user: mockUser } as any, dto);

      expect(providerProfilesService.addCategory).toHaveBeenCalledWith('user-123', 'category-123');
    });

    it('throws NotFoundException if profile does not exist', async () => {
      const dto: AddProviderCategoryDto = { categoryId: 'category-123' };

      providerProfilesService.addCategory.mockRejectedValue(
        new NotFoundException('Provider profile not found'),
      );

      await expect(controller.addCategory({ user: mockUser } as any, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if category does not exist', async () => {
      const dto: AddProviderCategoryDto = { categoryId: 'category-invalid' };

      providerProfilesService.addCategory.mockRejectedValue(
        new NotFoundException('Service category not found'),
      );

      await expect(controller.addCategory({ user: mockUser } as any, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ConflictException if category is already added', async () => {
      const dto: AddProviderCategoryDto = { categoryId: 'category-123' };

      providerProfilesService.addCategory.mockRejectedValue(
        new ConflictException('Category already added to provider'),
      );

      await expect(controller.addCategory({ user: mockUser } as any, dto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('removeCategory', () => {
    it("removes a category from the user's profile", async () => {
      const categoryId = 'category-123';

      providerProfilesService.removeCategory.mockResolvedValue(undefined);

      await controller.removeCategory({ user: mockUser } as any, categoryId);

      expect(providerProfilesService.removeCategory).toHaveBeenCalledWith('user-123', categoryId);
    });

    it('throws NotFoundException if profile does not exist', async () => {
      const categoryId = 'category-123';

      providerProfilesService.removeCategory.mockRejectedValue(
        new NotFoundException('Provider profile not found'),
      );

      await expect(
        controller.removeCategory({ user: mockUser } as any, categoryId),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if category is not associated with profile', async () => {
      const categoryId = 'category-123';

      providerProfilesService.removeCategory.mockRejectedValue(
        new NotFoundException('Category not found in provider profile'),
      );

      await expect(
        controller.removeCategory({ user: mockUser } as any, categoryId),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
