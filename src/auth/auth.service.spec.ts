import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: jest.Mock; findOne: jest.Mock };
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    usersService = { findByEmail: jest.fn(), findOne: jest.fn() };
    jwtService = { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
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
