import { serve } from '@hono/node-server';
import { createApp } from './app';
import { env } from './shared/lib/env';
import { logger } from './shared/lib/logger';
import { connectPrisma, disconnectPrisma } from './shared/lib/prisma';

async function main() {
  await connectPrisma();
  const app = createApp();

  const server = serve({ fetch: app.fetch, port: env.SERVER_PORT });
  logger.info(`Server is running on http://localhost:${env.SERVER_PORT}`);

  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    server.close();
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
