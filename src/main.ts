import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

export async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  // Defaults to the local frontend dev server so a missing env var doesn't
  // break local development; override via CORS_ORIGIN in other environments.
  const corsOrigin = configService.get<string>('CORS_ORIGIN', 'http://localhost:8080');

  // `transform: true` lets DTOs (e.g. FindUsersQueryDto) convert incoming
  // query strings (page, limit) into the numbers the handlers expect.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({ origin: corsOrigin });
  await app.listen(port);
}
bootstrap().catch((error) => console.error(error));
