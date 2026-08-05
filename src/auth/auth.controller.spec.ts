import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ExecutionContext, INestApplication } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { GoogleAuthGuard } from './google-auth/google-auth.guard';
import { GoogleStrategy } from './google.strategy';

describe('AuthController - Google OAuth', () => {
  const authService = {
    validateUser: jest.fn(),
    issueTokens: jest.fn(),
    issueAccessToken: jest.fn(),
  };

  const FRONTEND_ORIGIN = 'http://localhost:8080';

  const configService = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, string> = {
        GOOGLE_CLIENT_ID: 'test-client-id',
        GOOGLE_CLIENT_SECRET: 'test-client-secret',
        GOOGLE_CALLBACK_URL: 'http://localhost:3000/auth/google/callback',
        FRONTEND_ORIGIN,
      };
      const value = values[key];
      if (value === undefined) throw new Error(`No mock value configured for ${key}`);
      return value;
    }),
  };

  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.clearAllMocks();
  });

  it('applies GoogleAuthGuard to both googleAuth and googleAuthCallback', () => {
    // Read the raw function via the property descriptor rather than
    // `AuthController.prototype.googleAuth` directly: the latter is an
    // unbound method reference (flagged by @typescript-eslint/unbound-method),
    // and `@UseGuards` attaches metadata to the exact function object, so we
    // still need that same reference (not a `.bind()` copy) to read it back.
    const googleAuth = Object.getOwnPropertyDescriptor(AuthController.prototype, 'googleAuth')
      ?.value as unknown;
    const googleAuthCallback = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'googleAuthCallback',
    )?.value as unknown;

    const guardsOnAuth = Reflect.getMetadata(GUARDS_METADATA, googleAuth) as unknown[];
    const guardsOnCallback = Reflect.getMetadata(GUARDS_METADATA, googleAuthCallback) as unknown[];

    expect(guardsOnAuth).toContain(GoogleAuthGuard);
    expect(guardsOnCallback).toContain(GoogleAuthGuard);
  });

  describe('GET /auth/google', () => {
    let app: INestApplication<App>;

    beforeAll(async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authService },
          { provide: ConfigService, useValue: configService },
          GoogleStrategy,
        ],
      }).compile();

      app = moduleRef.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    // Exercises the real GoogleAuthGuard/GoogleStrategy (no overrides): if
    // @UseGuards(GoogleAuthGuard) were ever removed from googleAuth(), this
    // would return 200 from the empty handler body instead of redirecting.
    it('is guarded by GoogleAuthGuard and redirects to Google without ever reaching the handler body', async () => {
      const res = await request(app.getHttpServer()).get('/auth/google');

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain('accounts.google.com');
      expect(authService.issueTokens).not.toHaveBeenCalled();
    });
  });

  describe('GET /auth/google/callback', () => {
    let app: INestApplication<App>;
    const mockUser = { id: 'user-1', email: 'oauth@test.com' };

    const buildApp = async (): Promise<INestApplication<App>> => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [AuthController],
        providers: [
          { provide: AuthService, useValue: authService },
          { provide: ConfigService, useValue: configService },
        ],
      })
        // GoogleAuthGuard wraps AuthGuard('google'), which needs a real
        // OAuth `code` exchanged with Google to run end to end. We override
        // it with a fake that attaches req.user the same way the real
        // guard/strategy would after Google's redirect, so the test focuses
        // on what the controller does once the guard succeeds. Overriding
        // this specific guard also confirms it's the one actually wired to
        // the route via @UseGuards(GoogleAuthGuard).
        .overrideGuard(GoogleAuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest<{ user: typeof mockUser }>();
            req.user = mockUser;
            return true;
          },
        } satisfies CanActivate)
        .compile();

      const nestApp = moduleRef.createNestApplication();
      await nestApp.init();
      return nestApp;
    };

    beforeEach(() => {
      // setAuthCookies() computes real maxAge values from these, and passes
      // them to Express's real (unmocked) res.cookie() - it throws if they
      // resolve to NaN, so they need to be set for every test in this block.
      process.env.JWT_ACCESS_EXPIRES = '900';
      process.env.JWT_REFRESH_EXPIRES = '604800';

      authService.issueTokens.mockResolvedValue({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
      });
    });

    afterEach(async () => {
      if (app) await app.close();
    });

    it('issues tokens for the guard-attached user and redirects to FRONTEND_ORIGIN', async () => {
      app = await buildApp();

      const res = await request(app.getHttpServer()).get('/auth/google/callback');

      expect(authService.issueTokens).toHaveBeenCalledWith(mockUser.id, mockUser.email);
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe(FRONTEND_ORIGIN);
    });

    it('sets httpOnly access_token and refresh_token cookies with the expected paths', async () => {
      app = await buildApp();

      const res = await request(app.getHttpServer()).get('/auth/google/callback');
      const cookies = res.headers['set-cookie'] as unknown as string[];

      const accessCookie = cookies.find((c) => c.startsWith('access_token='));
      const refreshCookie = cookies.find((c) => c.startsWith('refresh_token='));

      expect(accessCookie).toBeDefined();
      expect(accessCookie).toContain('HttpOnly');
      expect(refreshCookie).toBeDefined();
      expect(refreshCookie).toContain('HttpOnly');
      expect(refreshCookie).toContain('Path=/auth/refresh');
    });

    it('defaults to SameSite=Lax and no Secure flag outside production (plain local HTTP dev)', async () => {
      process.env.NODE_ENV = 'development';
      delete process.env.COOKIE_SAME_SITE;
      app = await buildApp();

      const res = await request(app.getHttpServer()).get('/auth/google/callback');
      const cookies = res.headers['set-cookie'] as unknown as string[];

      expect(cookies[0]).toContain('SameSite=Lax');
      expect(cookies[0]).not.toContain('Secure');
    });

    it('uses SameSite=None and Secure in production', async () => {
      process.env.NODE_ENV = 'production';
      app = await buildApp();

      const res = await request(app.getHttpServer()).get('/auth/google/callback');
      const cookies = res.headers['set-cookie'] as unknown as string[];

      expect(cookies[0]).toContain('SameSite=None');
      expect(cookies[0]).toContain('Secure');
    });

    it('allows opting into SameSite=None outside production (e.g. local OAuth testing via an HTTPS tunnel), forcing Secure too', async () => {
      process.env.NODE_ENV = 'development';
      process.env.COOKIE_SAME_SITE = 'none';
      app = await buildApp();

      const res = await request(app.getHttpServer()).get('/auth/google/callback');
      const cookies = res.headers['set-cookie'] as unknown as string[];

      expect(cookies[0]).toContain('SameSite=None');
      expect(cookies[0]).toContain('Secure');
    });
  });
});
