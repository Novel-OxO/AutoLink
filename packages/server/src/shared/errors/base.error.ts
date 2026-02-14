import type { ContentfulStatusCode } from 'hono/utils/http-status';

export abstract class BaseException extends Error {
  abstract readonly statusCode: ContentfulStatusCode;
  abstract readonly errorCode: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

// ── 4xx Client Errors ──

export class BadRequestException extends BaseException {
  readonly statusCode = 400 as const;
  readonly errorCode: string;

  constructor(message = 'Bad Request', errorCode = 'BAD_REQUEST') {
    super(message);
    this.errorCode = errorCode;
  }
}

export class UnauthorizedException extends BaseException {
  readonly statusCode = 401 as const;
  readonly errorCode: string;

  constructor(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
    super(message);
    this.errorCode = errorCode;
  }
}

export class ForbiddenException extends BaseException {
  readonly statusCode = 403 as const;
  readonly errorCode: string;

  constructor(message = 'Forbidden', errorCode = 'FORBIDDEN') {
    super(message);
    this.errorCode = errorCode;
  }
}

export class NotFoundException extends BaseException {
  readonly statusCode = 404 as const;
  readonly errorCode: string;

  constructor(message = 'Not Found', errorCode = 'NOT_FOUND') {
    super(message);
    this.errorCode = errorCode;
  }
}

export class ConflictException extends BaseException {
  readonly statusCode = 409 as const;
  readonly errorCode: string;

  constructor(message = 'Conflict', errorCode = 'CONFLICT') {
    super(message);
    this.errorCode = errorCode;
  }
}

// ── 5xx Server Errors ──

export class InternalServerException extends BaseException {
  readonly statusCode = 500 as const;
  readonly errorCode: string;

  constructor(message = 'Internal Server Error', errorCode = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.errorCode = errorCode;
  }
}
