import { IsString, IsNumber, IsOptional, MinLength, Min, Max } from 'class-validator';
import { IsValidNip } from '../../common/validators/is-valid-nip.validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsValidNip()
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
  @Min(-90)
  @Max(90)
  baseLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  baseLng?: number;

  @IsOptional()
  @IsString()
  @MinLength(1)
  baseAddress?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1000)
  serviceRadiusKm?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
