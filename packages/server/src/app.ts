import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { env } from './lib/env';
import { errorHandler } from './middleware/error-handler';
import type { AppEnv } from './types/context';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(logger());
  app.use(secureHeaders());
  app.use(
    cors({
      origin: [`http://localhost:${env.WEB_PORT}`],
      credentials: true,
    }),
  );

  app.onError(errorHandler);
  app.get('/health', (c) => c.json({ status: 'ok' }));

  // TODO: 라우트 마운트 (향후 기능 구현 시 추가)

  return app;
}

export type AppType = ReturnType<typeof createApp>;
