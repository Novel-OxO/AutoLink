/**
 * Environment variable keys
 */
export const ENV_KEYS = {
  // Server
  SERVER_PORT: 'SERVER_PORT',

  // Database
  DATABASE_URL: 'DATABASE_URL',

  // Redis
  REDIS_URL: 'REDIS_URL',

  // OAuth - Google
  GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID',
  GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET',
  GOOGLE_CALLBACK_URL: 'GOOGLE_CALLBACK_URL',

  // OAuth - Apple
  APPLE_CLIENT_ID: 'APPLE_CLIENT_ID',
  APPLE_TEAM_ID: 'APPLE_TEAM_ID',
  APPLE_KEY_ID: 'APPLE_KEY_ID',
  APPLE_PRIVATE_KEY: 'APPLE_PRIVATE_KEY',

  // Session
  SESSION_SECRET: 'SESSION_SECRET',

  // OpenAI
  OPENAI_API_KEY: 'OPENAI_API_KEY',

  // App
  WEB_PORT: 'WEB_PORT',
  NODE_ENV: 'NODE_ENV',

  // Logging
  LOG_LEVEL: 'LOG_LEVEL',
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];
