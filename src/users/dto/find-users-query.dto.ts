import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Query params for GET /users. `page`/`limit` are transformed from the raw
// query strings into numbers (see ValidationPipe's `transform: true` option
// in main.ts) so they can be used directly for Prisma's `skip`/`take`.
export class FindUsersQueryDto {
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

  // Partial, case-insensitive match against the user's email. Surrounding
  // whitespace is trimmed before validation so a value like "  a@b.com  "
  // isn't rejected/queried with leading/trailing spaces, and length is capped
  // to keep the query parameter bounded.
  @IsOptional()
  @Transform(({ value }: TransformFnParams): unknown =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MaxLength(255)
  search?: string;
}
