import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL!,
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
