import { ConsoleLogger, Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class PinoLoggerService extends ConsoleLogger {
  readonly contextName: string;

  constructor(readonly logger: PinoLogger) {
    super();
    this.contextName = 'context';
  }

  setContext(name: string) {
    this.logger.setContext(name);
  }

  verbose(message: string, context?: string, ...args: unknown[]) {
    if (context) {
      this.logger.trace({ [this.contextName]: context }, message, ...args);
    } else {
      this.logger.trace(message, ...args);
    }
  }

  debug(message: string, context?: string, ...args: unknown[]) {
    if (context) {
      this.logger.debug({ [this.contextName]: context }, message, ...args);
    } else {
      this.logger.debug(message, ...args);
    }
  }

  log(message: string, context?: string, ...args: unknown[]) {
    if (context) {
      this.logger.info({ [this.contextName]: context }, message, ...args);
    } else {
      this.logger.info(message, ...args);
    }
  }

  warn(message: string, context?: string, ...args: unknown[]) {
    if (context) {
      this.logger.warn({ [this.contextName]: context }, message, ...args);
    } else {
      this.logger.warn(message, ...args);
    }
  }

  error(message: string, trace?: string, context?: string, ...args: unknown[]) {
    if (context) {
      this.logger.error({ [this.contextName]: context, trace }, message, ...args);
    } else if (trace) {
      this.logger.error({ trace }, message, ...args);
    } else {
      this.logger.error(message, ...args);
    }
  }
}
