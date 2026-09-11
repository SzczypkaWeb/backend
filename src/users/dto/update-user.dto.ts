// PartialType comes from @nestjs/swagger, not @nestjs/mapped-types directly:
// @nestjs/swagger re-exports the same helper but also copies over the
// Swagger @ApiProperty decorators from CreateUserDto, and (just as
// importantly) its dist build is plain CJS with its own vendored, CJS-only
// @nestjs/mapped-types@2.1.1 - avoiding the pure-ESM @nestjs/mapped-types@12
// (createRequire(import.meta.url) breaks under ts-jest, same root cause as
// the earlier @nestjs/swagger v12 incident - see BLOG_NOTES.md).
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

// All fields are optional so only the properties present in the request body
// are overwritten. Values are always set to the fixed payload provided by the
// client (no increment/append semantics), which keeps PATCH idempotent:
// sending the same body twice always results in the same resource state.
export class UpdateUserDto extends PartialType(CreateUserDto) {}
