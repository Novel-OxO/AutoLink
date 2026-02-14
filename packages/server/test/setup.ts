import { vi } from 'vitest';

// env mock — 모든 테스트에서 환경변수 접근 시 안전한 기본값 제공
// vi.mock은 Vitest가 import 전에 호이스팅하므로 실제 loadEnv()가 실행되지 않음
vi.mock('@/shared/lib/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    SESSION_SECRET: 'test-secret',
    GOOGLE_CLIENT_ID: 'test-google-client-id',
    GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
    GOOGLE_CALLBACK_URL: 'http://localhost:3001/auth/google/callback',
    SERVER_PORT: 3001,
    WEB_PORT: 3000,
    NODE_ENV: 'test',
  },
}));

// logger mock — 테스트에서 로그 출력 억제
vi.mock('@/shared/lib/logger', () => {
  const noop = () => {};
  const fakeLogger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => fakeLogger,
  };
  return {
    logger: fakeLogger,
    createLogger: () => fakeLogger,
  };
});
