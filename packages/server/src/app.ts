import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './features/identity-and-access/auth.routes';
import { workspaceRoutes } from './features/workspace/workspace.routes';
import { env } from './shared/lib/env';
import { errorHandler } from './shared/middleware/error-handler';
import { requestLogger } from './shared/middleware/request-logger';
import type { AppEnv } from './shared/types/context';

export function createApp() {
  const app = new Hono<AppEnv>();

  app.use(requestId());
  app.use(requestLogger);
  app.use(secureHeaders());
  app.use(
    cors({
      origin: [`http://localhost:${env.WEB_PORT}`],
      credentials: true,
    }),
  );

  app.onError(errorHandler);
  app.get('/health', (c) => c.json({ status: 'ok' }));

  app.route('/', authRoutes);
  app.route('/', workspaceRoutes);

  return app;
}

export type AppType = ReturnType<typeof createApp>;
