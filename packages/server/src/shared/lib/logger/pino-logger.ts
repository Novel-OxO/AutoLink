import pino from 'pino';

import type { Logger } from './logger.interface';

const PINO_TO_GCP_SEVERITY: Record<string, string> = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

export function createPinoLogger(nodeEnv: string): Logger {
  const isDev = nodeEnv === 'development';

  const instance = pino({
    level: isDev ? 'debug' : 'info',
    messageKey: 'message',
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    formatters: {
      level(label: string) {
        return { severity: PINO_TO_GCP_SEVERITY[label] ?? 'DEFAULT' };
      },
    },
    ...(isDev && {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'HH:MM:ss' },
      },
    }),
  });

  return wrapPino(instance);
}

function wrapPino(instance: pino.Logger): Logger {
  return {
    debug(msg, data) {
      data ? instance.debug(data, msg) : instance.debug(msg);
    },
    info(msg, data) {
      data ? instance.info(data, msg) : instance.info(msg);
    },
    warn(msg, data) {
      data ? instance.warn(data, msg) : instance.warn(msg);
    },
    error(msg, data) {
      data ? instance.error(data, msg) : instance.error(msg);
    },
    child(bindings) {
      return wrapPino(instance.child(bindings));
    },
  };
}
