import { env } from '../env';
import { createFakeLogger } from './fake-logger';
import type { Logger } from './logger.interface';
import { createPinoLogger } from './pino-logger';

export type { Logger } from './logger.interface';

export function createLogger(nodeEnv: string): Logger {
  if (nodeEnv === 'test') {
    return createFakeLogger();
  }
  return createPinoLogger(nodeEnv);
}

export const logger = createLogger(env.NODE_ENV);
