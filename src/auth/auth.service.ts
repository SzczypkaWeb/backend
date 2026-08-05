import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await argon2.verify(user.passwordHash, password);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
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
