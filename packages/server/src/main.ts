import { serve } from '@hono/node-server';

import { createApp } from './app';
import { env } from './lib/env';
import { connectPrisma, disconnectPrisma } from './lib/prisma';

async function main() {
  await connectPrisma();
  const app = createApp();

  serve({ fetch: app.fetch, port: env.SERVER_PORT });
  console.log(`Server is running on http://localhost:${env.SERVER_PORT}`);

  const shutdown = async () => {
    await disconnectPrisma();
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
