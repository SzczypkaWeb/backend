import { IsOptional, IsUUID } from 'class-validator';

export class FindServiceCategoriesQueryDto {
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
