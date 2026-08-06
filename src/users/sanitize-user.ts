import type { User } from '../../generated/prisma/client';

// Fields that must never be serialized back to a client, no matter which
// endpoint returns a User (or a partial/derived shape of one). Currently
// just the argon2 hash, but this is the single place to extend if another
// sensitive field is ever added to the User model.
const SENSITIVE_USER_FIELDS = ['passwordHash'] as const;

export type SafeUser = Omit<User, (typeof SENSITIVE_USER_FIELDS)[number]>;

// Strips sensitive fields from a User before it's returned from a service
// method to a controller. This is deliberately explicit field-picking
// (rather than a global ClassSerializerInterceptor) to match how this
// codebase already shapes responses: DTO -> Controller -> Service -> Prisma,
// with the service being the layer responsible for what a Prisma result
// looks like once it leaves it.
export function sanitizeUser<
  T extends Partial<Record<(typeof SENSITIVE_USER_FIELDS)[number], unknown>>,
>(user: T): Omit<T, (typeof SENSITIVE_USER_FIELDS)[number]> {
  const safeUser = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    delete safeUser[field];
  }
  return safeUser;
}
