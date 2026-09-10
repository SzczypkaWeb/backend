import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProviderProfileDto } from './create-provider-profile.dto';

describe('CreateProviderProfileDto', () => {
  const validDto = {
    nip: '1234567893', // Valid NIP with correct checksum
    companyName: 'Test Company',
    companyAddress: 'Test Address',
    baseLat: 50.0,
    baseLng: 19.0,
    baseAddress: 'Base Address',
    serviceRadiusKm: 50,
    bio: 'Test bio',
  };

  describe('NIP validation', () => {
    it('accepts valid NIP with correct checksum', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, validDto);
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('rejects NIP with incorrect length', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        nip: '123456789', // 9 digits instead of 10
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });

    it('rejects NIP with non-numeric characters', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        nip: 'abcd567890',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });

    it('rejects NIP with all zeros', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        nip: '0000000000',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });

    it('rejects NIP with invalid checksum', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        nip: '1234567891', // Wrong last digit
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });
  });

  describe('Geolocation validation', () => {
    it('accepts valid coordinates', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLat: 50.0,
        baseLng: 19.0,
      });
      const errors = await validate(dto);
      expect(
        errors.filter((e) => e.property === 'baseLat' || e.property === 'baseLng'),
      ).toHaveLength(0);
    });

    it('accepts edge case latitude values', async () => {
      const northPole = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLat: 90,
      });
      const southPole = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLat: -90,
      });
      const northErrors = await validate(northPole);
      const southErrors = await validate(southPole);
      expect(northErrors.filter((e) => e.property === 'baseLat')).toHaveLength(0);
      expect(southErrors.filter((e) => e.property === 'baseLat')).toHaveLength(0);
    });

    it('accepts edge case longitude values', async () => {
      const eastMost = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLng: 180,
      });
      const westMost = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLng: -180,
      });
      const eastErrors = await validate(eastMost);
      const westErrors = await validate(westMost);
      expect(eastErrors.filter((e) => e.property === 'baseLng')).toHaveLength(0);
      expect(westErrors.filter((e) => e.property === 'baseLng')).toHaveLength(0);
    });

    it('rejects latitude > 90', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLat: 91,
      });
      const errors = await validate(dto);
      const latErrors = errors.filter((e) => e.property === 'baseLat');
      expect(latErrors.length).toBeGreaterThan(0);
      expect(latErrors[0].constraints?.max).toBeDefined();
    });

    it('rejects latitude < -90', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLat: -91,
      });
      const errors = await validate(dto);
      const latErrors = errors.filter((e) => e.property === 'baseLat');
      expect(latErrors.length).toBeGreaterThan(0);
      expect(latErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects longitude > 180', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLng: 181,
      });
      const errors = await validate(dto);
      const lngErrors = errors.filter((e) => e.property === 'baseLng');
      expect(lngErrors.length).toBeGreaterThan(0);
      expect(lngErrors[0].constraints?.max).toBeDefined();
    });

    it('rejects longitude < -180', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseLng: -181,
      });
      const errors = await validate(dto);
      const lngErrors = errors.filter((e) => e.property === 'baseLng');
      expect(lngErrors.length).toBeGreaterThan(0);
      expect(lngErrors[0].constraints?.min).toBeDefined();
    });
  });

  describe('Service radius validation', () => {
    it('accepts valid service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 50,
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'serviceRadiusKm')).toHaveLength(0);
    });

    it('accepts minimum service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 1,
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'serviceRadiusKm')).toHaveLength(0);
    });

    it('rejects fractional service radius below the minimum whole kilometer', async () => {
      // serviceRadiusKm is Int in the Prisma schema - anything below 1 would
      // silently truncate to 0 on save (which itself is rejected below), so
      // the DTO must reject fractional values outright rather than accept
      // them and let Prisma's cast to Int corrupt the stored value.
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 0.5,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.min).toBeDefined();
    });

    it('accepts maximum service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 1000,
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'serviceRadiusKm')).toHaveLength(0);
    });

    it('rejects negative service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: -100,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects zero service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 0,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects excessive service radius', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        serviceRadiusKm: 1001,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.max).toBeDefined();
    });
  });

  describe('String field validation', () => {
    it('rejects empty companyName', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        companyName: '',
      });
      const errors = await validate(dto);
      const nameErrors = errors.filter((e) => e.property === 'companyName');
      expect(nameErrors.length).toBeGreaterThan(0);
    });

    it('rejects empty companyAddress', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        companyAddress: '',
      });
      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'companyAddress');
      expect(addressErrors.length).toBeGreaterThan(0);
    });

    it('rejects empty baseAddress', async () => {
      const dto = plainToInstance(CreateProviderProfileDto, {
        ...validDto,
        baseAddress: '',
      });
      const errors = await validate(dto);
      const addressErrors = errors.filter((e) => e.property === 'baseAddress');
      expect(addressErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Optional fields', () => {
    it('accepts dto without bio', async () => {
      const { nip, companyName, companyAddress, baseLat, baseLng, baseAddress, serviceRadiusKm } =
        validDto;
      const dtoWithoutBio = {
        nip,
        companyName,
        companyAddress,
        baseLat,
        baseLng,
        baseAddress,
        serviceRadiusKm,
      };
      const dto = plainToInstance(CreateProviderProfileDto, dtoWithoutBio);
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'bio')).toHaveLength(0);
    });
  });
});
