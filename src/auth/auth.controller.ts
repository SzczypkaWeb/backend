import { Controller, Post, Get, Body, Res, Req, HttpCode, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth/jwt-auth.guard';
import { JwtRefreshGuard } from './jwt-refresh/jwt-refresh.guard';

interface RequestWithUser extends Request {
  user: { userId: string; email: string };
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

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(dto.email, dto.password);
    const { accessToken, refreshToken } = await this.authService.issueTokens(user.id, user.email);

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
}
