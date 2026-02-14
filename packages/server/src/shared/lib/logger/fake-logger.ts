import type { Logger } from './logger.interface';

const noop = () => {};

export function createFakeLogger(): Logger {
  const fake: Logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: noop,
    child: () => fake,
  };

  return fake;
}
