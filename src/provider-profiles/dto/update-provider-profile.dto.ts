import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  nip?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  companyName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  companyAddress?: string;

  @IsOptional()
  @IsNumber()
  baseLat?: number;

  @IsOptional()
  @IsNumber()
  baseLng?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  baseAddress?: string;

  @IsOptional()
  @IsNumber()
  serviceRadiusKm?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
