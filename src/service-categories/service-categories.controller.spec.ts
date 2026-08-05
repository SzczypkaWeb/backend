import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';
import { FindServiceCategoriesQueryDto } from './dto/find-service-categories-query.dto';
import { ServiceCategoriesController } from './service-categories.controller';
import { ServiceCategoriesService } from './service-categories.service';

describe('ServiceCategoriesController', () => {
  let controller: ServiceCategoriesController;
  const serviceCategoriesService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServiceCategoriesController],
      providers: [{ provide: ServiceCategoriesService, useValue: serviceCategoriesService }],
    }).compile();

    controller = module.get<ServiceCategoriesController>(ServiceCategoriesController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('forwards the query DTO to the service', async () => {
      const categories = [
        {
          id: '1',
          name: 'Hydraulik',
          slug: 'hydraulik',
          parentId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      serviceCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll(new FindServiceCategoriesQueryDto());

      expect(serviceCategoriesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(categories);
    });

    it('forwards parentId filter when provided', async () => {
      const categories = [
        {
          id: '10',
          name: 'AC Repair',
          slug: 'ac-repair',
          parentId: 'parent-123',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      const query: FindServiceCategoriesQueryDto = { parentId: 'parent-123' };
      serviceCategoriesService.findAll.mockResolvedValue(categories);

      const result = await controller.findAll(query);

      expect(serviceCategoriesService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(categories);
    });

    it('returns empty array when no categories match', async () => {
      serviceCategoriesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(new FindServiceCategoriesQueryDto());

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';
    const mockCategory = {
      id: categoryId,
      name: 'Hydraulik',
      slug: 'hydraulik',
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('returns a category by id when found', async () => {
      serviceCategoriesService.findOne.mockResolvedValue(mockCategory);

      const result = await controller.findOne(categoryId);

      expect(serviceCategoriesService.findOne).toHaveBeenCalledWith(categoryId);
      expect(result).toEqual(mockCategory);
    });

    it('throws NotFoundException when category is not found', async () => {
      serviceCategoriesService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(categoryId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('calls the service with the provided DTO', async () => {
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
      serviceCategoriesService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(serviceCategoriesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });

    it('creates a category with parentId', async () => {
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
      serviceCategoriesService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(serviceCategoriesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(created);
    });
  });

  describe('update', () => {
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';

    it('calls the service with id and DTO', async () => {
      const dto: UpdateServiceCategoryDto = {
        name: 'Updated Hydraulik',
      };
      const updated = {
        id: categoryId,
        name: 'Updated Hydraulik',
        slug: 'hydraulik',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      serviceCategoriesService.update.mockResolvedValue(updated);

      const result = await controller.update(categoryId, dto);

      expect(serviceCategoriesService.update).toHaveBeenCalledWith(categoryId, dto);
      expect(result).toEqual(updated);
    });

    it('throws NotFoundException when category is not found', async () => {
      const dto: UpdateServiceCategoryDto = { name: 'Updated' };
      serviceCategoriesService.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(categoryId, dto)).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    const categoryId = '123e4567-e89b-12d3-a456-426614174000';

    it('calls the service delete method with the category id', async () => {
      serviceCategoriesService.delete.mockResolvedValue(undefined);

      await controller.delete(categoryId);

      expect(serviceCategoriesService.delete).toHaveBeenCalledWith(categoryId);
    });

    it('throws NotFoundException when category is not found', async () => {
      serviceCategoriesService.delete.mockRejectedValue(new NotFoundException());

      await expect(controller.delete(categoryId)).rejects.toThrow(NotFoundException);
    });
  });
});
