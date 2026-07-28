import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CreateListingDto } from './dto/create-listing.dto';
import { FindListingsQueryDto } from './dto/find-listings-query.dto';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';

describe('ListingsController', () => {
  let controller: ListingsController;
  const listingsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ListingsController],
      providers: [{ provide: ListingsService, useValue: listingsService }],
    }).compile();

    controller = module.get<ListingsController>(ListingsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('forwards the (already validated/transformed) query DTO to the service', async () => {
      const query: FindListingsQueryDto = { page: 2, limit: 5 };
      const paginated = { data: [], total: 0, page: 2, limit: 5, totalPages: 0 };
      listingsService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(query);

      expect(listingsService.findAll).toHaveBeenCalledWith(query);
      expect(listingsService.findAll).toHaveBeenCalledTimes(1);
      expect(result).toEqual(paginated);
    });

    it('returns the paginated listings from the service', async () => {
      const query: FindListingsQueryDto = { page: 1, limit: 10 };
      const listing = {
        id: '1',
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
        createdAt: new Date(),
      };
      const paginated = { data: [listing], total: 1, page: 1, limit: 10, totalPages: 1 };
      listingsService.findAll.mockResolvedValue(paginated);

      const result = await controller.findAll(query);

      expect(result).toEqual(paginated);
    });
  });

  describe('findOne', () => {
    const listingId = '123e4567-e89b-12d3-a456-426614174000';
    const mockListing = {
      id: listingId,
      title: 'Sofa',
      description: 'Comfy sofa',
      price: 19999,
      createdAt: new Date(),
    };

    it('returns a listing when found', async () => {
      listingsService.findOne.mockResolvedValue(mockListing);

      const result = await controller.findOne(listingId);

      expect(listingsService.findOne).toHaveBeenCalledWith(listingId);
      expect(listingsService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockListing);
    });

    it('throws NotFoundException when listing is not found', async () => {
      listingsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(listingId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('calls listingsService.create with the provided dto', async () => {
      const dto: CreateListingDto = {
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
      };
      const created = { id: '1', ...dto, createdAt: new Date() };
      listingsService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(listingsService.create).toHaveBeenCalledWith(dto);
      expect(listingsService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });
  });
});
