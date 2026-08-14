import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';

export class CreateProviderProfileDto {
  @IsString()
  @MinLength(1)
  nip: string;

  @IsString()
  @MinLength(1)
  companyName: string;

  @IsString()
  @MinLength(1)
  companyAddress: string;

  @IsNumber()
  baseLat: number;

  @IsNumber()
  baseLng: number;

  @IsString()
  @MinLength(1)
  baseAddress: string;

  @IsNumber()
  serviceRadiusKm: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
