import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import { BaseException } from '../errors/base.error';
import { logger as rootLogger } from '../lib/logger';
import type { AppEnv } from '../types/context';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const log = c.get('logger') ?? rootLogger;

  const respond = (
    statusCode: ContentfulStatusCode,
    message: string,
    errorCode: string,
    extra?: Record<string, unknown>,
  ) => c.json({ statusCode, message, errorCode, ...extra }, statusCode);

  if (err instanceof BaseException) {
    log.warn(err.name, {
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      message: err.message,
    });
    return respond(err.statusCode, err.message, err.errorCode);
  }

  if (err instanceof ZodError) {
    log.warn('Validation failed', { error: err.errors });
    return respond(400, 'Validation failed', 'VALIDATION_FAILED', { error: err.errors });
  }

  if (err instanceof HTTPException) {
    log.warn('HTTP exception', { statusCode: err.status, message: err.message });
    return respond(err.status as ContentfulStatusCode, err.message, 'HTTP_EXCEPTION');
  }

  log.error('Unhandled error', { error: err.message, stack: err.stack });
  return respond(500, 'Internal Server Error', 'INTERNAL_SERVER_ERROR');
};
