import { sanitizeUser } from './sanitize-user';

// This helper is the single place responsible for stripping sensitive
// fields (currently just `passwordHash`) from a User before it's ever
// returned to a client. It's unit-tested in isolation so every call site
// (UsersService, AuthService, ...) can rely on it without re-deriving the
// list of sensitive fields.
describe('sanitizeUser', () => {
  it('removes passwordHash from the returned object', () => {
    const user = {
      id: 'user-1',
      email: 'a@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$mocked$hash',
      googleId: null,
      authProvider: 'email',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    };

    const result = sanitizeUser(user);

    expect(result).not.toHaveProperty('passwordHash');
    expect((result as Record<string, unknown>).passwordHash).toBeUndefined();
  });

  it('keeps every other field untouched', () => {
    const user = {
      id: 'user-1',
      email: 'a@example.com',
      passwordHash: 'hash',
      googleId: 'google-sub-123',
      authProvider: 'google',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    };

    const result = sanitizeUser(user);

    expect(result).toEqual({
      id: 'user-1',
      email: 'a@example.com',
      googleId: 'google-sub-123',
      authProvider: 'google',
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  it('does not mutate the original object', () => {
    const user = { id: 'user-1', email: 'a@example.com', passwordHash: 'hash' };

    sanitizeUser(user);

    expect(user.passwordHash).toBe('hash');
  });
});
