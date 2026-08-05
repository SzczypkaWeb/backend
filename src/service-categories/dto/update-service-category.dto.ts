import { IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class UpdateServiceCategoryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  slug?: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
