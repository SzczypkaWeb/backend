import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindUsersQueryDto } from './find-users-query.dto';

// Exercises the DTO the same way the global ValidationPipe does in
// production: `plainToInstance` applies `@Transform` (trimming), then
// `validate` runs the class-validator decorators (e.g. @MaxLength(255)).
describe('FindUsersQueryDto', () => {
  it('trims surrounding whitespace from search', async () => {
    const dto = plainToInstance(FindUsersQueryDto, { search: '  hello@example.com  ' });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.search).toBe('hello@example.com');
  });

  it('accepts a search value at the 255 character limit', async () => {
    const dto = plainToInstance(FindUsersQueryDto, { search: 'a'.repeat(255) });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });

  it('rejects a search value longer than 255 characters', async () => {
    const dto = plainToInstance(FindUsersQueryDto, { search: 'a'.repeat(256) });

    const errors = await validate(dto);

    expect(errors).toHaveLength(1);
    expect(errors[0].constraints).toHaveProperty('maxLength');
  });

  it('rejects a search value that is only over the limit before trimming trailing spaces', async () => {
    // 255 real characters plus padding whitespace: trimming happens first,
    // so this should be valid, not rejected as too long.
    const dto = plainToInstance(FindUsersQueryDto, { search: `${'a'.repeat(255)}   ` });

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.search).toBe('a'.repeat(255));
  });

  it('allows search to be omitted', async () => {
    const dto = plainToInstance(FindUsersQueryDto, {});

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
    expect(dto.search).toBeUndefined();
  });
});
