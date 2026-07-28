import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindListingsQueryDto } from './find-listings-query.dto';

// Exercises the DTO the same way the global ValidationPipe does in
// production: `plainToInstance` applies `@Type` (numeric coercion), then
// `validate` runs the class-validator decorators.
describe('FindListingsQueryDto', () => {
  it('defaults to page 1 and limit 10 when omitted', async () => {
    const dto = plainToInstance(FindListingsQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(1);
    expect(dto.limit).toBe(10);
  });

  it('coerces string query params into numbers', async () => {
    const dto = plainToInstance(FindListingsQueryDto, { page: '2', limit: '5' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.page).toBe(2);
    expect(dto.limit).toBe(5);
  });

  it('rejects a limit greater than 100', async () => {
    const dto = plainToInstance(FindListingsQueryDto, { limit: 101 });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('max');
  });

  it('rejects a page less than 1', async () => {
    const dto = plainToInstance(FindListingsQueryDto, { page: 0 });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('min');
  });

  it('accepts an optional q (search query) parameter', async () => {
    const dto = plainToInstance(FindListingsQueryDto, { q: 'sofa' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.q).toBe('sofa');
  });

  it('defaults to undefined for q when omitted', async () => {
    const dto = plainToInstance(FindListingsQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.q).toBeUndefined();
  });

  it('accepts an optional location parameter', async () => {
    const dto = plainToInstance(FindListingsQueryDto, { location: 'Warsaw' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.location).toBe('Warsaw');
  });

  it('defaults to undefined for location when omitted', async () => {
    const dto = plainToInstance(FindListingsQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.location).toBeUndefined();
  });
});
