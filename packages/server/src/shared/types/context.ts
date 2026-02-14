import type { Logger } from '../lib/logger';

export type AppEnv = {
  Variables: {
    requestId: string;
    user: { id: number; email: string };
    sessionId: string;
    logger: Logger;
  };
};
