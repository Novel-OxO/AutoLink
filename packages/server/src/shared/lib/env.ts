import { z } from 'zod';

const allOrNone = (keys: string[]) => (data: Record<string, unknown>) => {
  const present = keys.filter((k) => data[k] != null);
  return present.length === 0 || present.length === keys.length;
};

const googleKeys = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL'] as const;
const appleKeys = [
  'APPLE_CLIENT_ID',
  'APPLE_TEAM_ID',
  'APPLE_KEY_ID',
  'APPLE_PRIVATE_KEY',
] as const;

const EnvSchema = z
  .object({
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
  })
  .refine(allOrNone([...googleKeys]), {
    message: `Google OAuth는 전부 설정하거나 전부 생략해야 합니다: ${googleKeys.join(', ')}`,
  })
  .refine(allOrNone([...appleKeys]), {
    message: `Apple OAuth는 전부 설정하거나 전부 생략해야 합니다: ${appleKeys.join(', ')}`,
  });

function loadEnv(): z.infer<typeof EnvSchema> {
  const result = EnvSchema.safeParse(process.env);

  if (result.success) {
    return result.data;
  }

  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `  - ${path}: ${issue.message}`;
  });

  console.error(
    [
      '',
      '╔══════════════════════════════════════════╗',
      '║   환경변수 검증 실패 — 서버를 시작할 수 없습니다   ║',
      '╚══════════════════════════════════════════╝',
      '',
      ...errors,
      '',
    ].join('\n'),
  );
  process.exit(1);
}

export type Env = z.infer<typeof EnvSchema>;
export const env = loadEnv();
