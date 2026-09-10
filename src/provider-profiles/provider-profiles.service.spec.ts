import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderProfilesService } from './provider-profiles.service';
import { CreateProviderProfileDto } from './dto/create-provider-profile.dto';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';

describe('ProviderProfilesService', () => {
  let service: ProviderProfilesService;
  const prismaService = {
    providerProfile: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    providerCategory: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    serviceCategory: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProviderProfilesService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<ProviderProfilesService>(ProviderProfilesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('creates a new provider profile for a user', async () => {
      const userId = 'user-123';
      const dto: CreateProviderProfileDto = {
        nip: '1234567893', // Valid NIP with correct checksum
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
        bio: 'Test bio',
      };

      const createdProfile = {
        id: 'profile-123',
        userId,
        ...dto,
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.providerProfile.create.mockResolvedValue(createdProfile);

      const result = await service.create(userId, dto);

      expect(prismaService.providerProfile.create).toHaveBeenCalledWith({
        data: {
          userId,
          ...dto,
        },
      });
      expect(result).toEqual(createdProfile);
    });

    it('throws ConflictException if user already has a profile', async () => {
      const userId = 'user-123';
      const dto: CreateProviderProfileDto = {
        nip: '1234567893', // Valid NIP with correct checksum
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
      };

      const prismaError = {
        code: 'P2002',
        meta: { target: ['userId'] },
      };

      prismaService.providerProfile.create.mockRejectedValue(prismaError);

      await expect(service.create(userId, dto)).rejects.toThrow(ConflictException);
      await expect(service.create(userId, dto)).rejects.toThrow(
        'User already has a provider profile',
      );
    });
  });

  describe('getOwn', () => {
    it("returns the user's provider profile with categories", async () => {
      const userId = 'user-123';
      const profile = {
        id: 'profile-123',
        userId,
        nip: '1234567893', // Valid NIP with correct checksum
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 50,
        bio: 'Test bio',
        verificationStatus: 'pending',
        categories: [
          {
            providerId: 'profile-123',
            categoryId: 'cat-123',
            category: {
              id: 'cat-123',
              name: 'Hydraulik',
              slug: 'hydraulik',
              parentId: null,
            },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.providerProfile.findUnique.mockResolvedValue(profile);

      const result = await service.getOwn(userId);

      expect(prismaService.providerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
        include: { categories: { include: { category: true } } },
      });
      expect(result).toEqual(profile);
    });

    it('throws NotFoundException if user has no profile', async () => {
      const userId = 'user-123';
      prismaService.providerProfile.findUnique.mockResolvedValue(null);

      await expect(service.getOwn(userId)).rejects.toThrow(NotFoundException);
      await expect(service.getOwn(userId)).rejects.toThrow('Provider profile not found');
    });
  });

  describe('updateOwn', () => {
    it("updates the user's provider profile", async () => {
      const userId = 'user-123';
      const dto: UpdateProviderProfileDto = {
        bio: 'Updated bio',
        serviceRadiusKm: 100,
      };

      const updated = {
        id: 'profile-123',
        userId,
        nip: '1234567893', // Valid NIP with correct checksum
        companyName: 'Test Company',
        companyAddress: 'Test Address',
        baseLat: 50.0,
        baseLng: 19.0,
        baseAddress: 'Base Address',
        serviceRadiusKm: 100,
        bio: 'Updated bio',
        verificationStatus: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.providerProfile.update.mockResolvedValue(updated);

      const result = await service.updateOwn(userId, dto);

      expect(prismaService.providerProfile.update).toHaveBeenCalledWith({
        where: { userId },
        data: dto,
        include: { categories: { include: { category: true } } },
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException if user has no profile', async () => {
      const userId = 'user-123';
      const dto: UpdateProviderProfileDto = { bio: 'Updated bio' };

      const prismaError = {
        code: 'P2025',
      };

      prismaService.providerProfile.update.mockRejectedValue(prismaError);

      await expect(service.updateOwn(userId, dto)).rejects.toThrow(NotFoundException);
      await expect(service.updateOwn(userId, dto)).rejects.toThrow('Provider profile not found');
    });
  });

  describe('addCategory', () => {
    it("adds a category to the user's provider profile", async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue({ id: 'profile-123' });
      prismaService.serviceCategory.findUnique.mockResolvedValue({ id: categoryId });
      prismaService.providerCategory.create.mockResolvedValue({
        providerId: 'profile-123',
        categoryId,
      });

      await service.addCategory(userId, categoryId);

      expect(prismaService.providerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.serviceCategory.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(prismaService.providerCategory.create).toHaveBeenCalledWith({
        data: {
          providerId: 'profile-123',
          categoryId,
        },
      });
    });

    it('throws NotFoundException if profile does not exist', async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue(null);

      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(NotFoundException);
      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(
        'Provider profile not found',
      );
    });

    it('throws NotFoundException if category does not exist', async () => {
      const userId = 'user-123';
      const categoryId = 'cat-invalid';

      prismaService.providerProfile.findUnique.mockResolvedValue({ id: 'profile-123' });
      prismaService.serviceCategory.findUnique.mockResolvedValue(null);

      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(NotFoundException);
      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(
        'Service category not found',
      );
    });

    it('throws ConflictException if category is already added', async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue({ id: 'profile-123' });
      prismaService.serviceCategory.findUnique.mockResolvedValue({ id: categoryId });

      const prismaError = {
        code: 'P2002',
        meta: { target: ['providerId', 'categoryId'] },
      };

      prismaService.providerCategory.create.mockRejectedValue(prismaError);

      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(ConflictException);
      await expect(service.addCategory(userId, categoryId)).rejects.toThrow(
        'Category already added to provider',
      );
    });
  });

  describe('removeCategory', () => {
    it("removes a category from the user's provider profile", async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue({ id: 'profile-123' });
      prismaService.providerCategory.delete.mockResolvedValue({
        providerId: 'profile-123',
        categoryId,
      });

      await service.removeCategory(userId, categoryId);

      expect(prismaService.providerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(prismaService.providerCategory.delete).toHaveBeenCalledWith({
        where: {
          providerId_categoryId: {
            providerId: 'profile-123',
            categoryId,
          },
        },
      });
    });

    it('throws NotFoundException if profile does not exist', async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue(null);

      await expect(service.removeCategory(userId, categoryId)).rejects.toThrow(NotFoundException);
      await expect(service.removeCategory(userId, categoryId)).rejects.toThrow(
        'Provider profile not found',
      );
    });

    it('throws NotFoundException if category is not associated with profile', async () => {
      const userId = 'user-123';
      const categoryId = 'cat-123';

      prismaService.providerProfile.findUnique.mockResolvedValue({ id: 'profile-123' });

      const prismaError = {
        code: 'P2025',
      };

      prismaService.providerCategory.delete.mockRejectedValue(prismaError);

      await expect(service.removeCategory(userId, categoryId)).rejects.toThrow(NotFoundException);
      await expect(service.removeCategory(userId, categoryId)).rejects.toThrow(
        'Category not found in provider profile',
      );
    });
  });
});
