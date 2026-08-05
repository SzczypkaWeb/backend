import 'reflect-metadata';
import { validateEnv } from './env.validation';

describe('validateEnv', () => {
  const requiredEnv = {
    GOOGLE_CLIENT_ID: 'client-id',
    GOOGLE_CLIENT_SECRET: 'client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
    FRONTEND_ORIGIN: 'http://localhost:8080',
  };

  it('returns the config untouched when all required variables are present', () => {
    const result = validateEnv({ ...requiredEnv, PORT: '3000' });

    expect(result.GOOGLE_CLIENT_ID).toBe('client-id');
    expect(result.GOOGLE_CLIENT_SECRET).toBe('client-secret');
    expect(result.GOOGLE_CALLBACK_URL).toBe('http://localhost:3000/auth/google/callback');
    expect(result.FRONTEND_ORIGIN).toBe('http://localhost:8080');
  });

  it.each(Object.keys(requiredEnv))('throws a clear error when %s is missing', (key) => {
    const config: Record<string, unknown> = { ...requiredEnv };
    delete config[key];

    expect(() => validateEnv(config)).toThrow(/Invalid environment configuration/);
  });

  it.each(Object.keys(requiredEnv))('throws a clear error when %s is an empty string', (key) => {
    const config = { ...requiredEnv, [key]: '' };

    expect(() => validateEnv(config)).toThrow(/Invalid environment configuration/);
  });

  it('reports all missing variables in a single error', () => {
    try {
      validateEnv({});
      throw new Error('expected validateEnv to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      const message = (error as Error).message;
      expect(message).toContain('GOOGLE_CLIENT_ID');
      expect(message).toContain('GOOGLE_CLIENT_SECRET');
      expect(message).toContain('GOOGLE_CALLBACK_URL');
      expect(message).toContain('FRONTEND_ORIGIN');
    }
  });
});
