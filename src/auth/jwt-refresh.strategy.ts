import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { Request } from 'express';
import { AuthService } from './auth.service';

const refreshCookieExtractor = (req: Request): string | null => {
  const token: unknown = req?.cookies?.refresh_token;
  return typeof token === 'string' ? token : null;
};

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: refreshCookieExtractor,
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET!,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    return this.authService.validatePayload(payload);
  }
}
