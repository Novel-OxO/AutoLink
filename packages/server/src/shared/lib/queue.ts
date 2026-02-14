import Bull from 'bull';

import { env } from './env';

export function createQueue<T>(name: string) {
  return new Bull<T>(name, env.REDIS_URL);
}
