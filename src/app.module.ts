import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { ListingsModule } from './listings/listings.module';
import { ServiceCategoriesModule } from './service-categories/service-categories.module';
import { ProviderProfilesModule } from './provider-profiles/provider-profiles.module';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { validateEnv } from './config/env.validation';
import { SentryGlobalFilter, SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    HealthModule,
    UsersModule,
    PrismaModule,
    ListingsModule,
    ServiceCategoriesModule,
    ProviderProfilesModule,
    AuthModule,
    SentryModule.forRoot(),
  ],
  controllers: [AppController, AuthController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
