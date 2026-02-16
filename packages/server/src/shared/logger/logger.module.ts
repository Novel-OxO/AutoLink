import { Global, Module } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import { stdTimeFunctions } from 'pino';
import * as uuid from 'uuid';
import { FakeLoggerService } from './adapters/fake/fakeLogger.service';
import { PinoLoggerService } from './adapters/real/pinoLogger.service';

declare module 'http' {
  interface IncomingMessage {
    requestId: string;
  }
}

@Global()
@Module({
  imports: [
    PinoLoggerModule.forRoot({
      pinoHttp: {
        name: 'autolink-server',
        level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
        genReqId: (req) => req.requestId || uuid.v4(),
        formatters: { bindings: () => ({}) },
        timestamp: stdTimeFunctions.unixTime,
        // 개발 환경에서는 pretty-print 사용
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'HH:MM:ss Z',
                  ignore: 'pid,hostname',
                  // 개발 환경에서만 컨텍스트를 메시지에 포함
                  messageFormat:
                    process.env.NODE_ENV === 'development' ? '{context} {msg}' : undefined,
                },
              }
            : undefined,
      },
    }),
  ],
  providers: [
    {
      provide: 'APP_LOGGER',
      useFactory: (logger: PinoLoggerService) => logger,
      inject: [PinoLoggerService],
    },
    FakeLoggerService,
    PinoLoggerService,
  ],
  exports: [FakeLoggerService, PinoLoggerService],
})
export class LoggerModule {}
