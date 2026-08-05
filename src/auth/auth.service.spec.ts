import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock; findOne: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let prismaService: { user: { update: jest.Mock; create: jest.Mock } };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), findOne: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };
    prismaService = { user: { update: jest.fn(), create: jest.fn() } };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
  });

  describe('validateUser', () => {
    it('throws UnauthorizedException when user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(authService.validateUser('nope@test.com', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      const passwordHash = await argon2.hash('correct-password');
      usersService.findByEmail.mockResolvedValue({ id: '1', email: 'a@test.com', passwordHash });

      await expect(authService.validateUser('a@test.com', 'wrong-password')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns the user when credentials are correct', async () => {
      const passwordHash = await argon2.hash('correct-password');
      const user = { id: '1', email: 'a@test.com', passwordHash };
      usersService.findByEmail.mockResolvedValue(user);

      const result = await authService.validateUser('a@test.com', 'correct-password');
      expect(result).toEqual(user);
    });

    it('throws UnauthorizedException for a Google-only account (no passwordHash)', async () => {
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'google@test.com',
        passwordHash: null,
        googleId: 'google-sub-123',
      });

      await expect(authService.validateUser('google@test.com', 'whatever')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('validateGoogleUser', () => {
    it('links the Google account to an existing user found by email that has no googleId yet', async () => {
      const existingUser = {
        id: '1',
        email: 'a@test.com',
        passwordHash: 'hash',
        googleId: null,
      };
      const linkedUser = { ...existingUser, googleId: 'google-sub-123' };
      usersService.findByEmail.mockResolvedValue(existingUser);
      prismaService.user.update.mockResolvedValue(linkedUser);

      const result = await authService.validateGoogleUser({
        email: 'a@test.com',
        googleId: 'google-sub-123',
      });

      expect(usersService.findByEmail).toHaveBeenCalledWith('a@test.com');
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { googleId: 'google-sub-123' },
      });
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(linkedUser);
    });

    it('returns the existing user as-is when the googleId is already linked (idempotent)', async () => {
      const existingUser = {
        id: '1',
        email: 'a@test.com',
        passwordHash: null,
        googleId: 'google-sub-123',
      };
      usersService.findByEmail.mockResolvedValue(existingUser);

      const result = await authService.validateGoogleUser({
        email: 'a@test.com',
        googleId: 'google-sub-123',
      });

      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(result).toEqual(existingUser);
    });

    it('creates a new user with no passwordHash when no account exists for that email', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        id: '2',
        email: 'new@test.com',
        passwordHash: null,
        googleId: 'google-sub-456',
      };
      prismaService.user.create.mockResolvedValue(createdUser);

      const result = await authService.validateGoogleUser({
        email: 'new@test.com',
        googleId: 'google-sub-456',
      });

      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@test.com',
          googleId: 'google-sub-456',
          passwordHash: null,
        },
      });
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result).toEqual(createdUser);
    });

    it('rejects malformed profile emails instead of writing them to the DB', async () => {
      await expect(
        authService.validateGoogleUser({ email: 'not-an-email', googleId: 'google-sub-789' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('rejects an empty profile email instead of writing it to the DB', async () => {
      await expect(
        authService.validateGoogleUser({ email: '', googleId: 'google-sub-789' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(usersService.findByEmail).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
      expect(prismaService.user.update).not.toHaveBeenCalled();
    });

    it('rejects a different Google account trying to link to an email already linked to another Google account', async () => {
      const existingUser = {
        id: '1',
        email: 'shared@test.com',
        passwordHash: null,
        googleId: 'google-sub-AAA',
      };
      usersService.findByEmail.mockResolvedValue(existingUser);

      await expect(
        authService.validateGoogleUser({ email: 'shared@test.com', googleId: 'google-sub-BBB' }),
      ).rejects.toThrow(ConflictException);

      // Must not silently overwrite the existing link or fabricate a session
      // for the mismatched Google account.
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(prismaService.user.create).not.toHaveBeenCalled();
    });

    it('propagates the error instead of swallowing it when Prisma update fails', async () => {
      const existingUser = {
        id: '1',
        email: 'a@test.com',
        passwordHash: 'hash',
        googleId: null,
      };
      usersService.findByEmail.mockResolvedValue(existingUser);
      const dbError = new Error('Prisma: connection lost');
      prismaService.user.update.mockRejectedValue(dbError);

      await expect(
        authService.validateGoogleUser({ email: 'a@test.com', googleId: 'google-sub-123' }),
      ).rejects.toThrow(dbError);
    });

    it('propagates the error instead of swallowing it when Prisma create fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const dbError = new Error('Prisma: unique constraint violation');
      prismaService.user.create.mockRejectedValue(dbError);

      await expect(
        authService.validateGoogleUser({ email: 'new@test.com', googleId: 'google-sub-456' }),
      ).rejects.toThrow(dbError);
    });

    it('does not leave corrupted state when two concurrent sign-ins race to create the same email', async () => {
      // Simulates two simultaneous OAuth callbacks for the same brand-new
      // email: both read `findByEmail` before either write lands, so both
      // proceed to `create`. In real Prisma, the second `create` would fail
      // on the unique `email` constraint - that failure must propagate
      // rather than be swallowed into a fabricated/duplicate user.
      usersService.findByEmail.mockResolvedValue(null);
      const createdUser = {
        id: '1',
        email: 'race@test.com',
        passwordHash: null,
        googleId: 'google-sub-first',
      };
      const uniqueConstraintError = Object.assign(new Error('Unique constraint failed on email'), {
        code: 'P2002',
      });
      prismaService.user.create
        .mockResolvedValueOnce(createdUser)
        .mockRejectedValueOnce(uniqueConstraintError);

      const [first, second] = await Promise.allSettled([
        authService.validateGoogleUser({ email: 'race@test.com', googleId: 'google-sub-first' }),
        authService.validateGoogleUser({ email: 'race@test.com', googleId: 'google-sub-second' }),
      ]);

      expect(first.status).toBe('fulfilled');
      expect(second.status).toBe('rejected');
      if (second.status === 'rejected') {
        expect(second.reason).toBe(uniqueConstraintError);
      }
      expect(prismaService.user.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('validatePayload', () => {
    it('throws UnauthorizedException when the user no longer exists (e.g. deleted/banned)', async () => {
      usersService.findOne.mockResolvedValue(null);
      await expect(
        authService.validatePayload({ sub: 'deleted-id', email: 'gone@test.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns userId/email when the user still exists', async () => {
      usersService.findOne.mockResolvedValue({ id: '1', email: 'a@test.com' });
      const result = await authService.validatePayload({ sub: '1', email: 'a@test.com' });
      expect(result).toEqual({ userId: '1', email: 'a@test.com' });
    });
  });
});
