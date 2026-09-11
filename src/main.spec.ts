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

// SwaggerModule.createDocument/setup expect a real Nest application
// instance (HTTP adapter, reflector, etc.), which `appMock` below isn't -
// calling the real ones here would throw. This test doesn't exercise
// Swagger's actual behavior anyway (it only checks bootstrap()'s CORS/
// cookie-parser wiring), so those two are mocked out.
//
// PartialType also needs a stub: it's evaluated at *import time*
// (`UpdateUserDto extends PartialType(CreateUserDto)`), as soon as
// something in the AppModule import chain pulls in update-user.dto.ts -
// so a missing/non-function value here throws immediately, before any
// test body runs. We don't need the real field-optionality behavior (this
// suite never touches UpdateUserDto), so a pass-through that just returns
// the class unchanged is enough - and, unlike re-requiring the real
// @nestjs/swagger module here, it can't reintroduce any module-loading
// quirks of its own.
jest.mock('@nestjs/swagger', () => ({
  PartialType: (classRef: new (...args: unknown[]) => unknown) => classRef,
  SwaggerModule: {
    createDocument: jest.fn(),
    setup: jest.fn(),
  },
  DocumentBuilder: jest.fn().mockImplementation(() => ({
    setTitle: jest.fn().mockReturnThis(),
    setVersion: jest.fn().mockReturnThis(),
    build: jest.fn(),
  })),
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
