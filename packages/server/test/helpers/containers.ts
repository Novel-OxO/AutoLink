import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { GenericContainer, type StartedTestContainer, Wait } from 'testcontainers';

export interface TestContainers {
  postgres: StartedPostgreSqlContainer;
  redis: StartedTestContainer;
}

export async function startContainers(): Promise<TestContainers> {
  const [postgres, redis] = await Promise.all([
    new PostgreSqlContainer('pgvector/pgvector:pg16')
      .withDatabase('autolink_test')
      .withUsername('test')
      .withPassword('test')
      .start(),
    new GenericContainer('redis:7-alpine')
      .withExposedPorts(6379)
      .withWaitStrategy(Wait.forLogMessage('Ready to accept connections'))
      .start(),
  ]);

  return { postgres, redis };
}

export async function stopContainers(containers: TestContainers): Promise<void> {
  await Promise.all([containers.postgres.stop(), containers.redis.stop()]);
}

export function getPostgresUrl(container: StartedPostgreSqlContainer): string {
  return container.getConnectionUri();
}

export function getRedisUrl(container: StartedTestContainer): string {
  const host = container.getHost();
  const port = container.getMappedPort(6379);
  return `redis://${host}:${port}`;
}
