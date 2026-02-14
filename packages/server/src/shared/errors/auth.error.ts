import { BadRequestException, UnauthorizedException } from './base.error';

export class SessionNotFoundException extends UnauthorizedException {
  constructor() {
    super('Session expired', 'SESSION_NOT_FOUND');
  }
}

export class SessionMissingException extends UnauthorizedException {
  constructor() {
    super('Unauthorized', 'SESSION_MISSING');
  }
}

export class UserNotFoundException extends UnauthorizedException {
  constructor() {
    super('Unauthorized', 'USER_NOT_FOUND');
  }
}

export class OAuthFailedException extends UnauthorizedException {
  constructor(message = 'OAuth authentication failed') {
    super(message, 'OAUTH_FAILED');
  }
}

export class UnsupportedProviderException extends BadRequestException {
  constructor(provider: string) {
    super(`Unsupported provider: ${provider}`, 'UNSUPPORTED_PROVIDER');
  }
}
