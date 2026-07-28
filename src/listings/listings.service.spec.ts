import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { FindListingsQueryDto } from './dto/find-listings-query.dto';
import { ListingsService } from './listings.service';

describe('ListingsService', () => {
  let service: ListingsService;
  const prismaService = {
    listing: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ListingsService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('applies the default pagination (page 1, limit 10) when no query is given', async () => {
      const listings = [
        {
          id: '1',
          title: 'Sofa',
          description: 'Comfy sofa',
          price: 19999,
          location: '',
          createdAt: new Date(),
        },
      ];
      prismaService.listing.findMany.mockResolvedValue(listings);
      prismaService.listing.count.mockResolvedValue(1);

      const result = await service.findAll();

      expect(prismaService.listing.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(prismaService.listing.count).toHaveBeenCalledWith();
      expect(result).toEqual({ data: listings, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('computes skip/take from the requested page and limit', async () => {
      const listings = [
        {
          id: '3',
          title: 'Chair',
          description: 'Wooden chair',
          price: 4999,
          location: 'Krakow',
          createdAt: new Date(),
        },
      ];
      prismaService.listing.findMany.mockResolvedValue(listings);
      prismaService.listing.count.mockResolvedValue(25);
      const query: FindListingsQueryDto = { page: 3, limit: 10 };

      const result = await service.findAll(query);

      expect(prismaService.listing.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
      });
      expect(result).toEqual({ data: listings, total: 25, page: 3, limit: 10, totalPages: 3 });
    });

    it('returns 0 total pages when there are no matching results', async () => {
      prismaService.listing.findMany.mockResolvedValue([]);
      prismaService.listing.count.mockResolvedValue(0);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    });

    it('filters by title search (case-insensitive) when q parameter is provided', async () => {
      const listings = [
        {
          id: '1',
          title: 'Sofa',
          description: 'Comfy sofa',
          price: 19999,
          location: 'Warsaw',
          createdAt: new Date(),
        },
      ];
      prismaService.listing.findMany.mockResolvedValue(listings);
      prismaService.listing.count.mockResolvedValue(1);
      const query: FindListingsQueryDto = { page: 1, limit: 10, q: 'sofa' };

      const result = await service.findAll(query);

      expect(prismaService.listing.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          title: {
            contains: 'sofa',
            mode: 'insensitive',
          },
        },
      });
      expect(prismaService.listing.count).toHaveBeenCalledWith({
        where: {
          title: {
            contains: 'sofa',
            mode: 'insensitive',
          },
        },
      });
      expect(result).toEqual({ data: listings, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('filters by location (case-insensitive) when location parameter is provided', async () => {
      const listings = [
        {
          id: '1',
          title: 'Sofa',
          description: 'Comfy sofa',
          price: 19999,
          location: 'Warsaw',
          createdAt: new Date(),
        },
      ];
      prismaService.listing.findMany.mockResolvedValue(listings);
      prismaService.listing.count.mockResolvedValue(1);
      const query: FindListingsQueryDto = { page: 1, limit: 10, location: 'warsaw' };

      const result = await service.findAll(query);

      expect(prismaService.listing.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          location: {
            contains: 'warsaw',
            mode: 'insensitive',
          },
        },
      });
      expect(prismaService.listing.count).toHaveBeenCalledWith({
        where: {
          location: {
            contains: 'warsaw',
            mode: 'insensitive',
          },
        },
      });
      expect(result).toEqual({ data: listings, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('filters by both title and location when both parameters are provided', async () => {
      const listings = [
        {
          id: '1',
          title: 'Sofa',
          description: 'Comfy sofa',
          price: 19999,
          location: 'Warsaw',
          createdAt: new Date(),
        },
      ];
      prismaService.listing.findMany.mockResolvedValue(listings);
      prismaService.listing.count.mockResolvedValue(1);
      const query: FindListingsQueryDto = { page: 1, limit: 10, q: 'sofa', location: 'warsaw' };

      const result = await service.findAll(query);

      expect(prismaService.listing.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        where: {
          AND: [
            {
              title: {
                contains: 'sofa',
                mode: 'insensitive',
              },
            },
            {
              location: {
                contains: 'warsaw',
                mode: 'insensitive',
              },
            },
          ],
        },
      });
      expect(prismaService.listing.count).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              title: {
                contains: 'sofa',
                mode: 'insensitive',
              },
            },
            {
              location: {
                contains: 'warsaw',
                mode: 'insensitive',
              },
            },
          ],
        },
      });
      expect(result).toEqual({ data: listings, total: 1, page: 1, limit: 10, totalPages: 1 });
    });

    it('returns empty results when no listings match the filter', async () => {
      prismaService.listing.findMany.mockResolvedValue([]);
      prismaService.listing.count.mockResolvedValue(0);
      const query: FindListingsQueryDto = { page: 1, limit: 10, q: 'nonexistent' };

      const result = await service.findAll(query);

      expect(result).toEqual({ data: [], total: 0, page: 1, limit: 10, totalPages: 0 });
    });
  });

  describe('findOne', () => {
    it('returns a listing when found', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';
      const mockListing = {
        id: listingId,
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
        location: 'Warsaw',
        createdAt: new Date(),
      };
      prismaService.listing.findUnique.mockResolvedValue(mockListing);

      const result = await service.findOne(listingId);

      expect(prismaService.listing.findUnique).toHaveBeenCalledWith({ where: { id: listingId } });
      expect(result).toEqual(mockListing);
    });

    it('returns null when listing is not found', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';
      prismaService.listing.findUnique.mockResolvedValue(null);

      const result = await service.findOne(listingId);

      expect(prismaService.listing.findUnique).toHaveBeenCalledWith({ where: { id: listingId } });
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates a listing with the provided data', async () => {
      const dto: CreateListingDto = {
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
      };
      const created = { id: '1', ...dto, location: '', createdAt: new Date() };
      prismaService.listing.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaService.listing.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });

  describe('remove', () => {
    it('removes a listing by id', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';
      const mockListing = {
        id: listingId,
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
        location: 'Warsaw',
        createdAt: new Date(),
      };
      prismaService.listing.delete.mockResolvedValue(mockListing);

      const result = await service.remove(listingId);

      expect(prismaService.listing.delete).toHaveBeenCalledWith({ where: { id: listingId } });
      expect(result).toEqual(mockListing);
    });

    it('throws NotFoundException when listing is not found', async () => {
      const listingId = '123e4567-e89b-12d3-a456-426614174000';
      prismaService.listing.delete.mockRejectedValue({ code: 'P2025' });

      await expect(service.remove(listingId)).rejects.toThrow();
    });
  });
});
