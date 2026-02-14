import { randomUUID } from 'node:crypto';

import Redis from 'ioredis';

import { env } from './env';
import { logger } from './logger';

export const redis = new Redis(env.REDIS_URL);

// --- Distributed Lock ---

interface LockOptions {
  ttl?: number;
  retries?: number;
  retryDelay?: number;
}

const UNLOCK_SCRIPT = `
  if redis.call("get", KEYS[1]) == ARGV[1] then
    return redis.call("del", KEYS[1])
  else
    return 0
  end
`;

/**
 * Redis 기반 분산락.
 * 콜백 실행 후 자동 해제. TTL 만료 시에도 안전하게 동작.
 *
 * @example
 * const result = await withLock('membership:42', async () => {
 *   // 이 블록은 동시에 하나의 프로세스만 실행
 *   return await processPayment(userId);
 * });
 *
 * @example
 * // 커스텀 옵션
 * await withLock('workspace:invite:7', callback, {
 *   ttl: 30_000,      // 30초 락 유지
 *   retries: 5,       // 5회 재시도
 *   retryDelay: 200,  // 200ms 간격
 * });
 */
export async function withLock<T>(
  key: string,
  fn: () => Promise<T>,
  options?: LockOptions,
): Promise<T> {
  const { ttl = 10_000, retries = 3, retryDelay = 100 } = options ?? {};
  const lockKey = `lock:${key}`;
  const lockValue = randomUUID();

  const acquired = await acquireLock(lockKey, lockValue, ttl, retries, retryDelay);
  if (!acquired) {
    throw new Error(`Failed to acquire lock: ${key}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(lockKey, lockValue);
  }
}

async function acquireLock(
  key: string,
  value: string,
  ttl: number,
  retries: number,
  retryDelay: number,
): Promise<boolean> {
  for (let i = 0; i <= retries; i++) {
    const result = await redis.set(key, value, 'PX', ttl, 'NX');
    if (result === 'OK') return true;

    if (i < retries) {
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }

  logger.warn('Lock acquisition failed', { key, retries });
  return false;
}

async function releaseLock(key: string, value: string): Promise<void> {
  await redis.eval(UNLOCK_SCRIPT, 1, key, value);
}

// --- Cache Utilities ---

interface CacheOptions {
  ttl: number;
}

/**
 * Redis 캐시 읽기/쓰기.
 * 캐시 히트 시 즉시 반환, 미스 시 fn 실행 후 저장.
 *
 * @example
 * const profile = await withCache(
 *   `user:profile:${userId}`,
 *   async () => prisma.user.findUnique({ where: { id: userId } }),
 *   { ttl: 300 },  // 5분
 * );
 */
export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions,
): Promise<T> {
  const cached = await redis.get(key);
  if (cached !== null) {
    return JSON.parse(cached) as T;
  }

  const result = await fn();
  await redis.set(key, JSON.stringify(result), 'EX', options.ttl);
  return result;
}

/**
 * 캐시 무효화. 단일 키 또는 패턴 삭제.
 *
 * @example
 * await invalidateCache('user:profile:42');
 *
 * @example
 * // 패턴 삭제 (SCAN 기반, 프로덕션 안전)
 * await invalidateCache('user:profile:*');
 */
export async function invalidateCache(pattern: string): Promise<void> {
  if (pattern.includes('*')) {
    let cursor = '0';
    do {
      const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } while (cursor !== '0');
  } else {
    await redis.del(pattern);
  }
}
