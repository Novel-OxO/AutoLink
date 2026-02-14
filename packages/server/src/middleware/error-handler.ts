import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { ZodError } from 'zod';

import type { AppEnv } from '../types/context';

export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  if (err instanceof ZodError) {
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
    return c.json(
      {
        statusCode: err.status,
        message: err.message,
        error: err.name,
      },
      err.status,
    );
  }

  console.error('Unhandled error:', err);
  return c.json(
    {
      statusCode: 500,
      message: 'Internal Server Error',
      error: 'InternalServerError',
    },
    500,
  );
};
