import { randomUUID } from 'node:crypto';

import type { Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';

import { SESSION_COOKIE_NAME, SESSION_PREFIX, SESSION_TTL } from '@/shared/constants';
import { env } from '@/shared/lib/env';
import { redis } from '@/shared/lib/redis';
import type { AppEnv } from '@/shared/types/context';

import type { SessionPayload } from './session.types';

export type { SessionPayload };

export async function createSession(payload: SessionPayload): Promise<string> {
  const sessionId = randomUUID();
  await redis.set(`${SESSION_PREFIX}${sessionId}`, JSON.stringify(payload), 'EX', SESSION_TTL);
  return sessionId;
}

export async function destroySession(sessionId: string): Promise<void> {
  await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

export function setSessionCookie(c: Context<AppEnv>, sessionId: string): void {
  setCookie(c, SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'Lax',
    path: '/',
    maxAge: SESSION_TTL,
  });
}

export function clearSessionCookie(c: Context<AppEnv>): void {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
}
