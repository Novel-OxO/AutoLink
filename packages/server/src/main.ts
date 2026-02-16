import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './shared/app.module';
import { ENV_KEYS } from './shared/constants/env.constants';
import { PinoLoggerService } from './shared/logger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const logger = app.get(PinoLoggerService);

  // NestJS 기본 로거를 Pino로 교체
  app.useLogger(logger);

  logger.setContext('Bootstrap');
  const port = configService.get<string>(ENV_KEYS.SERVER_PORT) || 3000;
  await app.listen(port);

  logger.log(`Server is running on port ${port}`);
}
bootstrap();
