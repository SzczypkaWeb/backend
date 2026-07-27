import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateListingDto } from './create-listing.dto';

describe('CreateListingDto', () => {
  it('accepts a valid payload', async () => {
    const dto = plainToInstance(CreateListingDto, {
      title: 'Sofa',
      description: 'Comfy sofa',
      price: 19999,
    });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects an empty title', async () => {
    const dto = plainToInstance(CreateListingDto, {
      title: '',
      description: 'Comfy sofa',
      price: 19999,
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'title')).toBe(true);
  });

  it('rejects a non-integer price', async () => {
    const dto = plainToInstance(CreateListingDto, {
      title: 'Sofa',
      description: 'Comfy sofa',
      price: 19.99,
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });

  it('rejects a negative price', async () => {
    const dto = plainToInstance(CreateListingDto, {
      title: 'Sofa',
      description: 'Comfy sofa',
      price: -1,
    });

    const errors = await validate(dto);

    expect(errors.some((e) => e.property === 'price')).toBe(true);
  });
});
