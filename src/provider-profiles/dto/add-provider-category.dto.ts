import { IsString, IsUUID } from 'class-validator';

export class AddProviderCategoryDto {
  @IsString()
  @IsUUID()
  categoryId: string;
}
