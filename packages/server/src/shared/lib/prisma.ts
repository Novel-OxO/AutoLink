import { PrismaPg } from '@prisma/adapter-pg';

import type { PrismaClient as PrismaClientType } from '../../generated/prisma/client';
import { PrismaClient } from '../../generated/prisma/client';
import { env } from './env';
import { logger } from './logger';

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });

export async function connectPrisma() {
  await prisma.$connect();
}

export async function disconnectPrisma() {
  await prisma.$disconnect();
}

// --- Transaction Utilities ---

type TransactionClient = Parameters<Parameters<PrismaClientType['$transaction']>[0]>[0];

export type { TransactionClient };

interface TransactionOptions {
  maxWait?: number;
  timeout?: number;
  isolationLevel?: 'ReadCommitted' | 'RepeatableRead' | 'Serializable';
}

/**
 * Interactive 트랜잭션 래퍼.
 * 콜백이 throw하면 자동 롤백, 성공하면 커밋.
 *
 * @example
 * const link = await withTransaction(async (tx) => {
 *   const link = await tx.link.create({ data: { ... } });
 *   await tx.linkTag.createMany({ data: tags });
 *   return link;
 * });
 */
export async function withTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: TransactionOptions,
): Promise<T> {
  return prisma.$transaction(fn, options);
}

/**
 * 재시도 가능한 트랜잭션.
 * Deadlock이나 일시적 연결 오류 시 자동 재시도.
 *
 * @example
 * const result = await withRetryTransaction(async (tx) => {
 *   await tx.membership.update({ where: { userId }, data: { ... } });
 *   await tx.membershipTransaction.create({ data: { ... } });
 *   return result;
 * }, { retries: 3 });
 */
export async function withRetryTransaction<T>(
  fn: (tx: TransactionClient) => Promise<T>,
  options?: TransactionOptions & { retries?: number; baseDelay?: number },
): Promise<T> {
  const { retries = 3, baseDelay = 100, ...txOptions } = options ?? {};

  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await prisma.$transaction(fn, txOptions);
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRetryableError(err)) {
        const delay = baseDelay * 2 ** attempt;
        logger.warn('Transaction failed, retrying', {
          attempt: attempt + 1,
          delay,
          error: err instanceof Error ? err.message : String(err),
        });
        await sleep(delay);
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

function isRetryableError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes('deadlock') ||
    msg.includes('could not serialize') ||
    msg.includes('connection') ||
    msg.includes('timeout')
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
