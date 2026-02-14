import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT', 3001);

  app.enableCors({
    origin: [`http://localhost:${configService.get<number>('WEB_PORT', 3000)}`],
    credentials: true,
  });

  await app.listen(port);
  console.log(`Server is running on http://localhost:${port}`);
}
bootstrap();
