import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';
import { GoogleStrategy } from './google.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule, PassportModule, JwtModule.register({})],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy, GoogleStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
