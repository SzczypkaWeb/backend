import { Controller, Post, Get, Body, Res, Req, HttpCode, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh/jwt-refresh.guard';
import { GoogleAuthGuard } from './google-auth/google-auth.guard';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
}

interface RequestWithGoogleUser extends Request {
  user: { id: string; email: string };
}

function getAccessTtlMs(): number {
  return parseInt(process.env.JWT_ACCESS_EXPIRES!, 10) * 1000;
}

function getRefreshTtlMs(): number {
  return parseInt(process.env.JWT_REFRESH_EXPIRES!, 10) * 1000;
}

function isProdEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Shared by the regular login endpoint and the Google OAuth callback so
  // both authentication paths issue the exact same cookies.
  private setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProdEnv(),
      sameSite: isProdEnv() ? 'none' : 'lax',
      maxAge: getAccessTtlMs(),
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: isProdEnv(),
      sameSite: isProdEnv() ? 'none' : 'lax',
      maxAge: getRefreshTtlMs(),
      path: '/auth/refresh',
    });
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.authService.issueTokens(user.id, user.email);

    this.setAuthCookies(res, accessToken, refreshToken);

    return { id: user.id, email: user.email };
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(JwtRefreshGuard)
  async refresh(@Req() req: RequestWithUser, @Res({ passthrough: true }) res: Response) {
    const accessToken = await this.authService.issueAccessToken(req.user.userId, req.user.email);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProdEnv(),
      sameSite: isProdEnv() ? 'none' : 'lax',
      maxAge: getAccessTtlMs(),
    });

    return { message: 'Token refreshed' };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/auth/refresh' });
    return { message: 'Logged out' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: RequestWithUser) {
    return req.user;
  }

  // Kicks off the Google OAuth flow. The guard redirects to Google; this
  // handler body never runs.
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleAuth() {}

  // Google redirects back here after the user grants consent. GoogleAuthGuard
  // runs GoogleStrategy#validate (which performs the account lookup/linking)
  // and attaches the resulting user to the request.
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthCallback(@Req() req: RequestWithGoogleUser, @Res() res: Response) {
    const { id, email } = req.user;
    const { accessToken, refreshToken } = await this.authService.issueTokens(id, email);

    this.setAuthCookies(res, accessToken, refreshToken);

    // The frontend calls GET /auth/me on load to pick up the session from
    // the cookies set above.
    res.redirect(process.env.FRONTEND_ORIGIN!);
  }
}
