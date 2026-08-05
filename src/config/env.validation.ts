import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, validateSync } from 'class-validator';

// Env vars that are read via non-null assertions (`process.env.X!`) deep
// inside strategies/controllers (GoogleStrategy, AuthController) would
// otherwise only blow up the first time a request actually needs them,
// crashing at runtime instead of failing fast when the app boots.
//
// This DTO is passed to ConfigModule.forRoot({ validate }) in AppModule, so
// a missing/empty value throws immediately on startup with a clear message.
export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_ID!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CLIENT_SECRET!: string;

  @IsString()
  @IsNotEmpty()
  GOOGLE_CALLBACK_URL!: string;

  @IsString()
  @IsNotEmpty()
  FRONTEND_ORIGIN!: string;
}

export function validateEnv(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
    whitelist: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(', '))
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return validatedConfig;
}
