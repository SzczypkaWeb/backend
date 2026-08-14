import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidNip', async: false })
export class IsValidNipConstraint implements ValidatorConstraintInterface {
  validate(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    // NIP must be exactly 10 digits
    if (!/^\d{10}$/.test(value)) {
      return false;
    }

    // Check if all digits are zero
    if (value === '0000000000') {
      return false;
    }

    // Validate checksum using the Polish NIP algorithm
    const weights = [1, 3, 7, 9, 1, 3, 7, 9, 1];
    let sum = 0;

    for (let i = 0; i < 9; i++) {
      sum += parseInt(value[i], 10) * weights[i];
    }

    const checksum = (10 - (sum % 10)) % 10;
    const lastDigit = parseInt(value[9], 10);

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
