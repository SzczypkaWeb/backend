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
      create: jest.fn(),
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
        { id: '1', title: 'Sofa', description: 'Comfy sofa', price: 19999, createdAt: new Date() },
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
  });

  describe('create', () => {
    it('creates a listing with the provided data', async () => {
      const dto: CreateListingDto = {
        title: 'Sofa',
        description: 'Comfy sofa',
        price: 19999,
      };
      const created = { id: '1', ...dto, createdAt: new Date() };
      prismaService.listing.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(prismaService.listing.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
    });
  });
});
