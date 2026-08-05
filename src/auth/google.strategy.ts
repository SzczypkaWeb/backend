import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      // These are validated at startup (see src/config/env.validation.ts,
      // wired into ConfigModule.forRoot in AppModule), so getOrThrow here is
      // just defense in depth, not the primary safety net.
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile'],
    });
    // This project authenticates via JWT + httpOnly cookies, not passport
    // sessions: `session` isn't a valid Strategy constructor option (it's an
    // `authenticate()` option), and @nestjs/passport's AuthGuard already
    // defaults to `session: false` (see @nestjs/passport's defaultOptions),
    // and no `passport.session()` middleware is registered in main.ts.
  }

  async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value;

    if (!email) {
      return done(new UnauthorizedException('Google account has no email'), false);
    }

    const user = await this.authService.validateGoogleUser({ email, googleId: profile.id });
    done(null, user);
  }
}
