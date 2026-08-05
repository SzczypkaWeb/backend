import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceCategoriesService } from './service-categories.service';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { FindServiceCategoriesQueryDto } from './dto/find-service-categories-query.dto';

describe('ServiceCategoriesService', () => {
  let service: ServiceCategoriesService;
  const prismaService = {
    serviceCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceCategoriesService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<ServiceCategoriesService>(ServiceCategoriesService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all top-level categories when no parentId filter is provided', async () => {
      const categories = [
        {
          id: '1',
          name: 'Hydraulik',
          slug: 'hydraulik',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Elektryk',
          slug: 'elektryk',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaService.serviceCategory.findMany.mockResolvedValue(categories);

      const result = await service.findAll();

      expect(prismaService.serviceCategory.findMany).toHaveBeenCalledWith({
        where: { parentId: null },
      });
      expect(result).toEqual(categories);
    });

    it('filters by parentId when provided in the query', async () => {
      const parentId = 'parent-123';
      const children = [
        {
          id: '10',
          name: 'AC Repair',
          slug: 'ac-repair',
          parentId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      prismaService.serviceCategory.findMany.mockResolvedValue(children);

      const query: FindServiceCategoriesQueryDto = { parentId };
      const result = await service.findAll(query);

      expect(prismaService.serviceCategory.findMany).toHaveBeenCalledWith({
        where: { parentId },
      });
      expect(result).toEqual(children);
    });

    it('returns empty array when no categories match the filter', async () => {
      prismaService.serviceCategory.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('returns a category by id', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const category = {
        id: categoryId,
        name: 'Hydraulik',
        slug: 'hydraulik',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.serviceCategory.findUnique.mockResolvedValue(category);

      const result = await service.findOne(categoryId);

      expect(prismaService.serviceCategory.findUnique).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual(category);
    });

    it('returns null when category is not found', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      prismaService.serviceCategory.findUnique.mockResolvedValue(null);

      const result = await service.findOne(categoryId);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a category with provided name, slug, and optional parentId', async () => {
      const dto: CreateServiceCategoryDto = {
        name: 'Hydraulik',
        slug: 'hydraulik',
      };
      const created = {
        id: '1',
        ...dto,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.serviceCategory.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaService.serviceCategory.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(created);
    });

    it('creates a category with a parent when parentId is provided', async () => {
      const dto: CreateServiceCategoryDto = {
        name: 'AC Repair',
        slug: 'ac-repair',
        parentId: 'parent-123',
      };
      const created = {
        id: '10',
        ...dto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.serviceCategory.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaService.serviceCategory.create).toHaveBeenCalledWith({
        data: dto,
      });
      expect(result).toEqual(created);
    });

    it('returns a 409 conflict error when slug already exists', async () => {
      const dto: CreateServiceCategoryDto = {
        name: 'Hydraulik',
        slug: 'hydraulik',
      };
      const prismaError = {
        code: 'P2002',
        meta: { target: ['slug'] },
      };
      prismaService.serviceCategory.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(ConflictException);
    });

    it('throws when parentId references a non-existent category', async () => {
      const dto: CreateServiceCategoryDto = {
        name: 'AC Repair',
        slug: 'ac-repair',
        parentId: 'nonexistent-parent',
      };
      const prismaError = {
        code: 'P2025',
      };
      prismaService.serviceCategory.create.mockRejectedValue(prismaError);

      await expect(service.create(dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('update', () => {
    it('updates a category with provided fields', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateServiceCategoryDto = {
        name: 'Updated Hydraulik',
        slug: 'updated-hydraulik',
      };
      const updated = {
        id: categoryId,
        ...dto,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.serviceCategory.update.mockResolvedValue(updated);

      const result = await service.update(categoryId, dto);

      expect(prismaService.serviceCategory.update).toHaveBeenCalledWith({
        where: { id: categoryId },
        data: dto,
      });
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when category is not found', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateServiceCategoryDto = { name: 'Updated' };
      prismaService.serviceCategory.update.mockRejectedValue({ code: 'P2025' });

      await expect(service.update(categoryId, dto)).rejects.toThrow(NotFoundException);
    });

    it('returns a 409 conflict error when new slug already exists', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateServiceCategoryDto = {
        slug: 'existing-slug',
      };
      const prismaError = {
        code: 'P2002',
        meta: { target: ['slug'] },
      };
      prismaService.serviceCategory.update.mockRejectedValue(prismaError);

      await expect(service.update(categoryId, dto)).rejects.toThrow(ConflictException);
    });

    it('throws NotFoundException when updating parentId to a non-existent category', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const dto: UpdateServiceCategoryDto = {
        parentId: 'nonexistent-parent',
      };
      const prismaError = {
        code: 'P2025',
      };
      prismaService.serviceCategory.update.mockRejectedValue(prismaError);

      await expect(service.update(categoryId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes a category by id', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const deleted = {
        id: categoryId,
        name: 'Hydraulik',
        slug: 'hydraulik',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prismaService.serviceCategory.delete.mockResolvedValue(deleted);

      const result = await service.delete(categoryId);

      expect(prismaService.serviceCategory.delete).toHaveBeenCalledWith({
        where: { id: categoryId },
      });
      expect(result).toEqual(deleted);
    });

    it('throws NotFoundException when category is not found', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      prismaService.serviceCategory.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.delete(categoryId)).rejects.toThrow(NotFoundException);
    });

    it('returns a 409 conflict error when category is referenced by provider_categories', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const prismaError = {
        code: 'P2014',
        meta: { relation_name: 'providerCategories' },
      };
      prismaService.serviceCategory.delete.mockRejectedValue(prismaError);

      await expect(service.delete(categoryId)).rejects.toThrow(ConflictException);
    });

    it('returns a 409 conflict error when category is referenced by service_requests', async () => {
      const categoryId = '123e4567-e89b-12d3-a456-426614174000';
      const prismaError = {
        code: 'P2014',
        meta: { relation_name: 'serviceRequests' },
      };
      prismaService.serviceCategory.delete.mockRejectedValue(prismaError);

      await expect(service.delete(categoryId)).rejects.toThrow(ConflictException);
    });
  });
});
