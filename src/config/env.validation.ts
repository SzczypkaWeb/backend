import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsString, IsUrl, validateSync } from 'class-validator';

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

  // GOOGLE_CALLBACK_URL and FRONTEND_ORIGIN are both used as redirect
  // targets (the OAuth callback URL registered with Google, and the address
  // the browser is redirected to after login, respectively). @IsUrl()
  // ensures they're well-formed absolute URLs, not just non-empty strings,
  // so a typo'd/malicious value fails fast at startup instead of enabling an
  // open redirect at request time.
  //
  // require_tld: false allows `http://localhost:3000` (the local dev
  // default, see .env.example), which has no top-level domain.
  // require_protocol: true rejects bare hosts like "evil.com" or "not-a-url"
  // that validator.js would otherwise accept as relative-looking URLs.
  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, require_protocol: true })
  GOOGLE_CALLBACK_URL!: string;

  @IsString()
  @IsNotEmpty()
  @IsUrl({ require_tld: false, require_protocol: true })
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
