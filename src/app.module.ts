import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ListingsModule } from './listings/listings.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    HealthModule,
    UsersModule,
    PrismaModule,
    ListingsModule,
    ServiceCategoriesModule,
    AuthModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export class AppModule {}
