import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UpdateProviderProfileDto } from './update-provider-profile.dto';

describe('UpdateProviderProfileDto', () => {
  describe('NIP validation', () => {
    it('accepts valid NIP with correct checksum', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        nip: '1234567893', // Valid NIP with correct checksum
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'nip')).toHaveLength(0);
    });

    it('allows nip to be optional', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        bio: 'Updated bio',
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'nip')).toHaveLength(0);
    });

    it('rejects NIP with incorrect length when provided', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        nip: '123456789', // 9 digits instead of 10
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });

    it('rejects NIP with all zeros when provided', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        nip: '0000000000',
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].constraints?.isValidNip).toBeDefined();
    });
  });

  describe('Geolocation validation', () => {
    it('allows baseLat to be optional', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        bio: 'Updated bio',
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'baseLat')).toHaveLength(0);
    });

    it('rejects baseLat > 90', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        baseLat: 91,
      });
      const errors = await validate(dto);
      const latErrors = errors.filter((e) => e.property === 'baseLat');
      expect(latErrors.length).toBeGreaterThan(0);
      expect(latErrors[0].constraints?.max).toBeDefined();
    });

    it('rejects baseLat < -90', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        baseLat: -91,
      });
      const errors = await validate(dto);
      const latErrors = errors.filter((e) => e.property === 'baseLat');
      expect(latErrors.length).toBeGreaterThan(0);
      expect(latErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects baseLng > 180', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        baseLng: 181,
      });
      const errors = await validate(dto);
      const lngErrors = errors.filter((e) => e.property === 'baseLng');
      expect(lngErrors.length).toBeGreaterThan(0);
      expect(lngErrors[0].constraints?.max).toBeDefined();
    });

    it('rejects baseLng < -180', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        baseLng: -181,
      });
      const errors = await validate(dto);
      const lngErrors = errors.filter((e) => e.property === 'baseLng');
      expect(lngErrors.length).toBeGreaterThan(0);
      expect(lngErrors[0].constraints?.min).toBeDefined();
    });
  });

  describe('Service radius validation', () => {
    it('allows serviceRadiusKm to be optional', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        bio: 'Updated bio',
      });
      const errors = await validate(dto);
      expect(errors.filter((e) => e.property === 'serviceRadiusKm')).toHaveLength(0);
    });

    it('rejects negative serviceRadiusKm when provided', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        serviceRadiusKm: -100,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects zero serviceRadiusKm when provided', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        serviceRadiusKm: 0,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.min).toBeDefined();
    });

    it('rejects excessive serviceRadiusKm when provided', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        serviceRadiusKm: 1001,
      });
      const errors = await validate(dto);
      const radiusErrors = errors.filter((e) => e.property === 'serviceRadiusKm');
      expect(radiusErrors.length).toBeGreaterThan(0);
      expect(radiusErrors[0].constraints?.max).toBeDefined();
    });
  });

  describe('Partial updates', () => {
    it('allows updating only bio', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        bio: 'New bio',
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('allows updating only serviceRadiusKm', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        serviceRadiusKm: 75,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('allows updating multiple fields at once', async () => {
      const dto = plainToInstance(UpdateProviderProfileDto, {
        bio: 'Updated bio',
        serviceRadiusKm: 100,
        baseLat: 52.0,
        baseLng: 21.0,
      });
      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});
