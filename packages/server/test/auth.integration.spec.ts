import Redis from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OAuthStrategy } from '@/features/identity-and-access/oauth.strategy';
import type { PrismaClient as PrismaClientType } from '@/generated/prisma/client';
import {
  getPostgresUrl,
  getRedisUrl,
  startContainers,
  stopContainers,
  type TestContainers,
} from './helpers/containers';
import { cleanDatabase, createTestPrismaClient } from './helpers/prisma-test-client';

// ── 모듈 mock ──

let testPrisma: PrismaClientType;
let testRedis: Redis;

vi.mock('@/shared/lib/prisma', () => ({
  get prisma() {
    return testPrisma;
  },
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
  withTransaction: vi.fn(async (fn: any, options?: any) => {
    return testPrisma.$transaction(fn, options);
  }),
  withRetryTransaction: vi.fn(async (fn: any, options?: any) => {
    return testPrisma.$transaction(fn, options);
  }),
}));

vi.mock('@/shared/lib/redis', () => ({
  get redis() {
    return testRedis;
  },
  withLock: vi.fn(async (_key: string, fn: () => any) => fn()),
  withCache: vi.fn(async (_key: string, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

const mockStrategy: OAuthStrategy = {
  provider: 'GOOGLE',
  buildAuthUrl: vi.fn(() => 'https://accounts.google.com/mock-auth-url'),
  exchangeCode: vi.fn(async () => ({ accessToken: 'mock-access-token' })),
  fetchUserInfo: vi.fn(async () => ({
    providerId: 'google-123',
    email: 'test@example.com',
    nickname: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
  })),
};

vi.mock('@/features/identity-and-access/google.oauth', () => ({
  createGoogleOAuth: () => mockStrategy,
}));

// ── 테스트 본문 ──

let containers: TestContainers;
let createApp: typeof import('@/app').createApp;

beforeAll(async () => {
  containers = await startContainers();

  const postgresUrl = getPostgresUrl(containers.postgres);
  testPrisma = await createTestPrismaClient(postgresUrl);

  const redisUrl = getRedisUrl(containers.redis);
  testRedis = new Redis(redisUrl);

  const appModule = await import('@/app');
  createApp = appModule.createApp;
}, 120_000);

afterAll(async () => {
  await testPrisma?.$disconnect();
  testRedis?.disconnect();
  await stopContainers(containers);
});

beforeEach(async () => {
  await cleanDatabase(testPrisma);
  await testRedis.flushdb();
  vi.clearAllMocks();

  (mockStrategy.exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
    accessToken: 'mock-access-token',
  });
  (mockStrategy.fetchUserInfo as ReturnType<typeof vi.fn>).mockResolvedValue({
    providerId: 'google-123',
    email: 'test@example.com',
    nickname: 'Test User',
    profileImage: 'https://example.com/photo.jpg',
  });
});

// ── 헬퍼 ──

function makeApp() {
  return createApp();
}

function extractSessionCookie(response: Response): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/autolink_sid=([^;]+)/);
  return match ? match[1] : null;
}

function authCookie(sessionId: string): string {
  return `autolink_sid=${sessionId}`;
}

async function jsonBody<T = Record<string, unknown>>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

// ── 테스트 ──

describe('Auth Flow 통합 테스트', () => {
  describe('GET /auth/google', () => {
    it('Google OAuth URL로 리다이렉트한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/google');

      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('https://accounts.google.com/mock-auth-url');
    });
  });

  describe('GET /auth/google/callback', () => {
    it('신규 사용자를 생성하고 세션을 설정한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/google/callback?code=test-code');

      expect(res.status).toBe(302);
      expect(res.headers.get('location')).toBe('http://localhost:3000');

      const sessionId = extractSessionCookie(res);
      expect(sessionId).toBeTruthy();

      // Redis에 세션 저장 확인
      const sessionData = await testRedis.get(`session:${sessionId}`);
      expect(sessionData).toBeTruthy();
      const session = JSON.parse(sessionData!);
      expect(session.email).toBe('test@example.com');

      // DB에 사용자 생성 확인
      const user = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
        include: { oauths: true },
      });
      expect(user).toBeTruthy();
      expect(user!.nickname).toBe('Test User');
      expect(user!.oauths).toHaveLength(1);
      expect(user!.oauths[0].provider).toBe('GOOGLE');
      expect(user!.oauths[0].providerId).toBe('google-123');
    });

    it('기존 사용자로 로그인하면 새 사용자를 생성하지 않는다', async () => {
      const app = makeApp();

      await app.request('/auth/google/callback?code=first-code');
      const res = await app.request('/auth/google/callback?code=second-code');

      expect(res.status).toBe(302);

      const users = await testPrisma.user.findMany();
      expect(users).toHaveLength(1);
    });

    it('같은 이메일의 기존 사용자에 OAuth를 연결한다', async () => {
      await testPrisma.user.create({
        data: { email: 'test@example.com', nickname: 'Existing User' },
      });

      const app = makeApp();
      const res = await app.request('/auth/google/callback?code=link-code');

      expect(res.status).toBe(302);

      const users = await testPrisma.user.findMany({
        include: { oauths: true },
      });
      expect(users).toHaveLength(1);
      expect(users[0].nickname).toBe('Existing User');
      expect(users[0].oauths).toHaveLength(1);
    });

    it('code 파라미터가 없으면 400을 반환한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/google/callback');

      expect(res.status).toBe(400);
    });

    it('soft-deleted 사용자가 다시 로그인하면 복원된다', async () => {
      const app = makeApp();

      await app.request('/auth/google/callback?code=create-code');

      const user = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      await testPrisma.user.update({
        where: { id: user!.id },
        data: { deletedAt: new Date() },
      });

      const res = await app.request('/auth/google/callback?code=restore-code');
      expect(res.status).toBe(302);

      const restored = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(restored!.deletedAt).toBeNull();
    });
  });

  describe('GET /auth/unsupported', () => {
    it('지원하지 않는 provider는 400을 반환한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/unsupported');

      expect(res.status).toBe(400);
      const body = await jsonBody(res);
      expect(body.errorCode).toBe('UNSUPPORTED_PROVIDER');
    });
  });

  describe('POST /auth/logout', () => {
    it('세션을 삭제하고 쿠키를 제거한다', async () => {
      const app = makeApp();

      const loginRes = await app.request('/auth/google/callback?code=login-code');
      const sessionId = extractSessionCookie(loginRes)!;

      const logoutRes = await app.request('/auth/logout', {
        method: 'POST',
        headers: { Cookie: authCookie(sessionId) },
      });

      expect(logoutRes.status).toBe(200);
      const body = await jsonBody(logoutRes);
      expect(body.message).toBe('로그아웃 되었습니다');

      const session = await testRedis.get(`session:${sessionId}`);
      expect(session).toBeNull();
    });

    it('인증되지 않은 요청은 401을 반환한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/logout', { method: 'POST' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('현재 사용자 정보를 반환한다', async () => {
      const app = makeApp();

      const loginRes = await app.request('/auth/google/callback?code=me-code');
      const sessionId = extractSessionCookie(loginRes)!;

      const meRes = await app.request('/auth/me', {
        headers: { Cookie: authCookie(sessionId) },
      });

      expect(meRes.status).toBe(200);
      const body = await jsonBody<{
        email: string;
        nickname: string;
        oauths: { provider: string }[];
      }>(meRes);
      expect(body.email).toBe('test@example.com');
      expect(body.nickname).toBe('Test User');
      expect(body.oauths).toHaveLength(1);
      expect(body.oauths[0].provider).toBe('GOOGLE');
    });

    it('인증되지 않은 요청은 401을 반환한다', async () => {
      const app = makeApp();
      const res = await app.request('/auth/me');

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /auth/me', () => {
    it('사용자를 soft delete하고 세션을 삭제한다', async () => {
      const app = makeApp();

      const loginRes = await app.request('/auth/google/callback?code=delete-code');
      const sessionId = extractSessionCookie(loginRes)!;

      const deleteRes = await app.request('/auth/me', {
        method: 'DELETE',
        headers: { Cookie: authCookie(sessionId) },
      });

      expect(deleteRes.status).toBe(200);
      const body = await jsonBody(deleteRes);

      expect(body.message).toBe('탈퇴 처리되었습니다');

      const user = await testPrisma.user.findUnique({
        where: { email: 'test@example.com' },
      });
      expect(user!.deletedAt).not.toBeNull();

      const session = await testRedis.get(`session:${sessionId}`);
      expect(session).toBeNull();
    });
  });
});
