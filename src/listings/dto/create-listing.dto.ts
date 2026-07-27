import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CreateListingDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(1)
  description: string;

  // Price in cents (e.g. 1999 = $19.99). Must be a non-negative integer to
  // avoid floating-point rounding issues when handling money.
  @IsInt()
  @Min(0)
  price: number;
}
