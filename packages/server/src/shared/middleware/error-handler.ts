import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import { logger as rootLogger } from '../lib/logger';
import type { AppEnv } from '../types/context';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const log = c.get('logger') ?? rootLogger;

  if (err instanceof ZodError) {
    log.warn('Validation failed', { error: err.errors });
    return c.json(
      {
        statusCode: 400,
        message: 'Validation failed',
        error: err.errors,
      },
      400,
    );
  }

  if (err instanceof HTTPException) {
    log.warn('HTTP exception', {
      statusCode: err.status,
      message: err.message,
    });
    return c.json(
      {
        statusCode: err.status,
        message: err.message,
        error: err.name,
      },
      err.status,
    );
  }

  log.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  return c.json(
    {
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'InternalServerError',
    },
    500,
  );
};
