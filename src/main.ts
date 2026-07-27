import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  // `transform: true` lets DTOs (e.g. FindUsersQueryDto) convert incoming
  // query strings (page, limit) into the numbers the handlers expect.
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors({ origin: 'http://localhost:8080' });
  await app.listen(port);
}
bootstrap().catch((error) => console.error(error));
