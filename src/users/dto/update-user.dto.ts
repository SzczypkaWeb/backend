import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

// All fields are optional so only the properties present in the request body
// are overwritten. Values are always set to the fixed payload provided by the
// client (no increment/append semantics), which keeps PATCH idempotent:
// sending the same body twice always results in the same resource state.
export class UpdateUserDto extends PartialType(CreateUserDto) {}
