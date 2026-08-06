import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { isEmail } from 'class-validator';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

interface GoogleProfile {
  email: string;
  googleId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    // Google-only accounts have no passwordHash, so email/password login
    // must be rejected rather than passed to argon2 (which requires a
    // non-empty hash string).
    if (!user.passwordHash) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  // Account-linking logic used by GoogleStrategy#validate: finds a user by
  // the email address returned by Google, links the Google account to it if
  // it isn't linked yet, or creates a brand new (password-less) user.
  //
  // Defense in depth: GoogleStrategy already rejects a profile with no
  // email at all, but the format itself is never checked before it's
  // persisted. `profile.emails` is attacker/provider-controlled data (in
  // theory malformed, or absent despite the `email` scope being granted),
  // so it's re-validated here - the layer that actually writes to the DB -
  // rather than trusting the caller.
  async validateGoogleUser({ email, googleId }: GoogleProfile) {
    if (!email || !isEmail(email)) {
      throw new UnauthorizedException('Google account has no valid email');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      if (existingUser.googleId === googleId) return existingUser;

      // The email is already linked to a *different* Google account.
      // Silently overwriting the link (or logging the caller in as the
      // existing user) would let one Google account hijack another
      // account simply by sharing an email address, so this is rejected
      // explicitly instead.
      if (existingUser.googleId) {
        throw new ConflictException('This email is already linked to a different Google account');
      }

      return this.prisma.user.update({
        where: { id: existingUser.id },
        data: { googleId },
      });
    }

    return this.prisma.user.create({
      data: {
        email,
        googleId,
        passwordHash: null,
        // Explicit rather than relying on the schema's column default
        // ('email'): a brand-new Google-authenticated user must never end
        // up mislabeled as an email/password signup. See UsersService.create
        // for the equivalent explicit set on the email/password path.
        authProvider: 'google',
      },
    });
  }

  async issueAccessToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    return this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET!,
      expiresIn: parseInt(process.env.JWT_ACCESS_EXPIRES!, 10),
    });
  }

  async issueTokens(userId: string, email: string) {
    const accessToken = await this.issueAccessToken(userId, email);

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, email },
      {
        secret: process.env.JWT_REFRESH_SECRET!,
        expiresIn: parseInt(process.env.JWT_REFRESH_EXPIRES!, 10),
      },
    );

    return { accessToken, refreshToken };
  }

  async validatePayload(payload: { sub: string; email: string }) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user) throw new UnauthorizedException();
    return { userId: user.id, email: user.email };
  }
}
