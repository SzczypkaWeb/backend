import { IsString, MinLength, IsOptional, IsUUID } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @MinLength(1)
  slug: string;

  @IsOptional()
  @IsUUID()
  parentId?: string;
}
