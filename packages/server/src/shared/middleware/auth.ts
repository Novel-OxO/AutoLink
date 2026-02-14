import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';

import { SESSION_COOKIE_NAME, SESSION_PREFIX } from '../constants';
import { SessionMissingException, SessionNotFoundException } from '../errors/auth.error';
import { redis } from '../lib/redis';
import type { AppEnv } from '../types/context';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) {
    throw new SessionMissingException();
  }

  const session = await redis.get(`${SESSION_PREFIX}${sessionId}`);
  if (!session) {
    throw new SessionNotFoundException();
  }

  const user = JSON.parse(session) as { id: number; email: string };
  c.set('user', user);
  c.set('sessionId', sessionId);

  await next();
});
