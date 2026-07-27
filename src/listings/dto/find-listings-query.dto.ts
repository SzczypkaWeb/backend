import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

// Query params for GET /listings. `page`/`limit` are transformed from the raw
// query strings into numbers (see ValidationPipe's `transform: true` option
// in main.ts) so they can be used directly for Prisma's `skip`/`take`.
// Mirrors the pagination pattern used by FindUsersQueryDto.
export class FindListingsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;
}
