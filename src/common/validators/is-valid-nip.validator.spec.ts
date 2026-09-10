import { IsValidNipConstraint } from './is-valid-nip.validator';

describe('IsValidNipConstraint', () => {
  let constraint: IsValidNipConstraint;

  beforeEach(() => {
    constraint = new IsValidNipConstraint();
  });

  describe('validate', () => {
    it('accepts valid NIP with correct checksum', () => {
      expect(constraint.validate('1234567893')).toBe(true);
    });

    it('rejects non-string values', () => {
      expect(constraint.validate(1234567890)).toBe(false);
      expect(constraint.validate(null)).toBe(false);
      expect(constraint.validate(undefined)).toBe(false);
      expect(constraint.validate([])).toBe(false);
      expect(constraint.validate({})).toBe(false);
    });

    it('rejects strings shorter than 10 digits', () => {
      expect(constraint.validate('123456789')).toBe(false);
      expect(constraint.validate('12345')).toBe(false);
      expect(constraint.validate('')).toBe(false);
    });

    it('rejects strings longer than 10 digits', () => {
      expect(constraint.validate('12345678901')).toBe(false);
      expect(constraint.validate('123456789012345')).toBe(false);
    });

    it('rejects strings with non-numeric characters', () => {
      expect(constraint.validate('123456789a')).toBe(false);
      expect(constraint.validate('abcd567890')).toBe(false);
      expect(constraint.validate('123-456-789-0')).toBe(false);
      expect(constraint.validate('123.456.789.0')).toBe(false);
    });

    it('rejects all-zero NIP', () => {
      expect(constraint.validate('0000000000')).toBe(false);
    });

    it('rejects NIP with invalid checksum', () => {
      expect(constraint.validate('1234567891')).toBe(false); // Wrong last digit
      expect(constraint.validate('1234567899')).toBe(false);
      expect(constraint.validate('1234567800')).toBe(false);
    });

    it('accepts other valid NIPs with correct checksums', () => {
      // These are test NIPs with valid checksums
      expect(constraint.validate('5260001239')).toBe(true);
      expect(constraint.validate('9000000001')).toBe(true);
    });

    it('provides descriptive error message', () => {
      const message = constraint.defaultMessage();
      expect(message).toContain('NIP');
      expect(message).toContain('Polish Tax ID');
      expect(message).toContain('10 digits');
    });
  });

  describe('NIP checksum algorithm', () => {
    it('correctly validates checksum for various NIPs', () => {
      // Test multiple valid NIPs with correct checksums
      const validNips = ['1234567893', '5260001239', '9000000001'];

      validNips.forEach((nip) => {
        expect(constraint.validate(nip)).toBe(true, `NIP ${nip} should be valid`);
      });
    });

    it('correctly rejects invalid checksums', () => {
      // Modify last digit of valid NIPs to make them invalid
      const invalidNips = [
        '1234567891', // Changed last digit from 3
        '5260001234', // Changed last digit from 9
        '9000000002', // Changed last digit from 1
      ];

      invalidNips.forEach((nip) => {
        expect(constraint.validate(nip)).toBe(false, `NIP ${nip} should be invalid`);
      });
    });
  });
});
