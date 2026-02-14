import { getCookie } from 'hono/cookie';
import { createMiddleware } from 'hono/factory';
import { HTTPException } from 'hono/http-exception';

import { redis } from '../lib/redis';
import type { AppEnv } from '../types/context';

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const sessionId = getCookie(c, 'autolink_sid');

  if (!sessionId) {
    throw new HTTPException(401, { message: 'Unauthorized' });
  }

  const session = await redis.get(`session:${sessionId}`);

  if (!session) {
    throw new HTTPException(401, { message: 'Session expired' });
  }

  const user = JSON.parse(session) as { id: number; email: string };
  c.set('user', user);
  c.set('sessionId', sessionId);

  await next();
});
