jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
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
    listen: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    appMock.listen.mockResolvedValue(undefined);
    (NestFactory.create as jest.Mock).mockResolvedValue(appMock);
  });

  it('enables CORS for the configured CORS_ORIGIN env var', async () => {
    appMock.get.mockReturnValue(createConfigServiceStub({ CORS_ORIGIN: 'https://example.com' }));

    await bootstrap();

    expect(appMock.enableCors).toHaveBeenCalledWith({ origin: 'https://example.com' });
  });

  it('falls back to the localhost dev origin when CORS_ORIGIN is not set', async () => {
    appMock.get.mockReturnValue(createConfigServiceStub({}));

    await bootstrap();

    expect(appMock.enableCors).toHaveBeenCalledWith({ origin: 'http://localhost:8080' });
  });
});
