# AGENTS.md

This file provides guidance to AI agents when working with code in this repository.

## Communication Language

**AI agents must respond in Korean when working with this project.** All responses, explanations, and communications should be in Korean to maintain consistency with the project's primary language.

## Environment Variables

All environment variable keys should be accessed through the constants defined in `src/shared/constants/env.constants.ts`:

```typescript
import { ENV_KEYS } from './shared/constants/env.constants';

// Usage in ConfigService
const port = configService.get<string>(ENV_KEYS.SERVER_PORT) || 3000;
const dbUrl = configService.get<string>(ENV_KEYS.DATABASE_URL);
```

### Available Environment Keys

- **Server**: `ENV_KEYS.SERVER_PORT`
- **Database**: `ENV_KEYS.DATABASE_URL`
- **Redis**: `ENV_KEYS.REDIS_URL`
- **OAuth Google**: `ENV_KEYS.GOOGLE_CLIENT_ID`, `ENV_KEYS.GOOGLE_CLIENT_SECRET`, `ENV_KEYS.GOOGLE_CALLBACK_URL`
- **OAuth Apple**: `ENV_KEYS.APPLE_CLIENT_ID`, `ENV_KEYS.APPLE_TEAM_ID`, `ENV_KEYS.APPLE_KEY_ID`, `ENV_KEYS.APPLE_PRIVATE_KEY`
- **Session**: `ENV_KEYS.SESSION_SECRET`
- **OpenAI**: `ENV_KEYS.OPENAI_API_KEY`
- **App**: `ENV_KEYS.WEB_PORT`, `ENV_KEYS.NODE_ENV`
- **Logging**: `ENV_KEYS.LOG_LEVEL`

## Logging

The server uses Pino logger with custom configuration:

- **Development**: Logs are formatted with context in message for readability: `[12:00:29 UTC] INFO: Bootstrap Server is running on port 8080`
- **Production**: Structured logs are maintained for GCP Cloud Logging compatibility
- **All logs**: Use `PinoLoggerService` instead of default NestJS logger
- **Context**: Set context using `logger.setContext('ContextName')`

## Configuration

- **Environment files**: Located in server directory root (`.env.development`, `.env`)
- **ConfigModule**: Globally configured with automatic environment loading
- **Port**: Dynamically set via `ENV_KEYS.SERVER_PORT` from environment variables

## Development Commands

```bash
# Development server with environment variables
pnpm dev  # Uses cross-env NODE_ENV=development

# Build and start
pnpm build
pnpm start:prod
```
