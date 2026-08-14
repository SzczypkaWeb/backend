import { IsString, IsNumber, IsOptional, MinLength, Min, Max } from 'class-validator';
import { IsValidNip } from '../../common/validators/is-valid-nip.validator';

export class CreateProviderProfileDto {
  @IsValidNip()
  nip: string;

  @IsString()
  @MinLength(1)
  companyName: string;

  @IsString()
  @MinLength(1)
  companyAddress: string;

  @IsNumber()
  @Min(-90)
  @Max(90)
  baseLat: number;

  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLng: number;

  @IsString()
  @MinLength(1)
  baseAddress: string;

  @IsNumber()
  @Min(1)
  @Max(1000)
  serviceRadiusKm: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
