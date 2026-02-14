import { createMiddleware } from 'hono/factory';

import { logger } from '../lib/logger';
import type { AppEnv } from '../types/context';

export const requestLogger = createMiddleware<AppEnv>(async (c, next) => {
  const start = Date.now();
  const requestId = c.get('requestId');

  const childLogger = logger.child({ requestId });
  c.set('logger', childLogger);

  await next();

  const latencyMs = Date.now() - start;
  const status = c.res.status;
  const method = c.req.method;
  const path = c.req.path;

  childLogger.info('Request completed', {
    httpRequest: {
      requestMethod: method,
      requestUrl: path,
      status,
      latency: `${(latencyMs / 1000).toFixed(3)}s`,
    },
  });
});
