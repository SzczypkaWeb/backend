import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
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
