import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidNip', async: false })
export class IsValidNipConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // NIP must be exactly 10 digits
    if (!/^\d{10}$/.test(value)) {
      return false;
    }

    // All-zeros would otherwise pass the checksum below (0 * any weight = 0,
    // and (10 - 0 % 10) % 10 = 0 matches the last digit) - not a real NIP,
    // so it needs its own explicit rejection.
    if (value === '0000000000') {
      return false;
    }

    // Validate checksum using the Polish NIP algorithm. Number(), not
    // parseInt() - the regex above already guarantees every character is a
    // digit, so there's no radix/partial-parse ambiguity to guard against.
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += Number(value[i]) * weights[i];
    }

    const checksum = (10 - (sum % 10)) % 10;
    const lastDigit = Number(value[9]);

    return checksum === lastDigit;
  }

  defaultMessage(): string {
    return 'NIP must be a valid Polish Tax ID (10 digits with valid checksum)';
  }
}

export function IsValidNip(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      target: target.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidNipConstraint,
    });
  };
}
