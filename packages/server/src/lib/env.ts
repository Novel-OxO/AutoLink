import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  SESSION_SECRET: z.string(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALLBACK_URL: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  SERVER_PORT: z.coerce.number().default(3001),
  WEB_PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof EnvSchema>;
export const env = EnvSchema.parse(process.env);
