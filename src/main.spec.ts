jest.mock('@nestjs/core', () => ({
  ...jest.requireActual<typeof import('@nestjs/core')>('@nestjs/core'),
  NestFactory: {
    create: jest.fn(),
  },
}));

jest.mock('argon2', () => ({
  hash: jest.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$mocked$hash'),
  verify: jest.fn().mockResolvedValue(true),
}));

import { NestFactory } from '@nestjs/core';
import { bootstrap } from './main';

function createConfigServiceStub(values: Record<string, unknown>) {
  return {
    get: jest.fn((key: string, defaultValue?: unknown) =>
      key in values ? values[key] : defaultValue,
    ),
  };
}

describe('bootstrap', () => {
  const appMock = {
    get: jest.fn(),
    useGlobalPipes: jest.fn(),
    enableCors: jest.fn(),
    use: jest.fn(),
    listen: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    appMock.listen.mockResolvedValue(undefined);
    (NestFactory.create as jest.Mock).mockResolvedValue(appMock);
    appMock.get.mockReturnValue(createConfigServiceStub({ PORT: 3000 }));
  });

  afterEach(() => {
    delete process.env.FRONTEND_ORIGIN;
  });

  it('enables CORS for the configured FRONTEND_ORIGIN env var, with credentials', async () => {
    process.env.FRONTEND_ORIGIN = 'https://example.com';
    await bootstrap();
    expect(appMock.enableCors).toHaveBeenCalledWith({
      origin: 'https://example.com',
      credentials: true,
    });
  });

  it('applies cookie-parser middleware', async () => {
    process.env.FRONTEND_ORIGIN = 'https://example.com';
    await bootstrap();
    expect(appMock.use).toHaveBeenCalled();
  });
});
