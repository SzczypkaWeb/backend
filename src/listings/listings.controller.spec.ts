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
    remove: jest.fn(),
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
        location: 'Warsaw',
        viewCount: 0,
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
      location: 'Warsaw',
      viewCount: 1,
      createdAt: new Date(),
    };

    it('returns a listing with viewCount when found', async () => {
      listingsService.findOne.mockResolvedValue(mockListing);

      const result = await controller.findOne(listingId);

      expect(listingsService.findOne).toHaveBeenCalledWith(listingId);
      expect(listingsService.findOne).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockListing);
      expect(result.viewCount).toBe(1);
    });

    it('includes viewCount in the response body', async () => {
      listingsService.findOne.mockResolvedValue(mockListing);

      const result = await controller.findOne(listingId);

      expect(result).toHaveProperty('viewCount');
      expect(result.viewCount).toBe(1);
    });

    it('throws NotFoundException when listing is not found', async () => {
      listingsService.findOne.mockResolvedValue(null);

      await expect(controller.findOne(listingId)).rejects.toThrow(NotFoundException);
    });

    it('increments viewCount on each successive call to findOne', async () => {
      const listing1 = { ...mockListing, viewCount: 1 };
      const listing2 = { ...mockListing, viewCount: 2 };
      listingsService.findOne.mockResolvedValueOnce(listing1);
      listingsService.findOne.mockResolvedValueOnce(listing2);

      const result1 = await controller.findOne(listingId);
      const result2 = await controller.findOne(listingId);

      expect(result1.viewCount).toBe(1);
      expect(result2.viewCount).toBe(2);
    });
  });

  describe('create', () => {
    it('calls listingsService.create with the provided dto', async () => {
      const dto: CreateListingDto = {
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
      };
      const created = { id: '1', ...dto, location: '', viewCount: 0, createdAt: new Date() };
      listingsService.create.mockResolvedValue(created);

      const result = await controller.create(dto);

      expect(listingsService.create).toHaveBeenCalledWith(dto);
      expect(listingsService.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    const listingId = '123e4567-e89b-12d3-a456-426614174000';

    it('calls listingsService.remove with the listing id', async () => {
      listingsService.remove = jest.fn().mockResolvedValue(undefined);

      await controller.remove(listingId);

      expect(listingsService.remove).toHaveBeenCalledWith(listingId);
      expect(listingsService.remove).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when listing is not found', async () => {
      const removeErrorMessage = `Listing with id ${listingId} not found`;
      listingsService.remove = jest
        .fn()
        .mockRejectedValue(new NotFoundException(removeErrorMessage));

      await expect(controller.remove(listingId)).rejects.toThrow(NotFoundException);
    });
  });
});
