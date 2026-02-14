import { OAuthCallbackQuerySchema } from '@autolink/shared/schemas';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';

import { UnsupportedProviderException, UserNotFoundException } from '@/shared/errors/auth.error';
import { env } from '@/shared/lib/env';
import { requireAuth } from '@/shared/middleware/auth';
import type { AppEnv } from '@/shared/types/context';

import { findOrCreateUserByOAuth, getUserWithOAuths, softDeleteUser } from './auth.service';
import { createGoogleOAuth } from './google.oauth';
import type { OAuthStrategy } from './oauth.strategy';
import { clearSessionCookie, createSession, destroySession, setSessionCookie } from './session';

export const authRoutes = new Hono<AppEnv>();

const strategies: Map<string, OAuthStrategy> = new Map();

if (env.GOOGLE_CLIENT_ID) {
  strategies.set('google', createGoogleOAuth());
}

function getStrategy(provider: string): OAuthStrategy {
  const strategy = strategies.get(provider);
  if (!strategy) {
    throw new UnsupportedProviderException(provider);
  }
  return strategy;
}

// POST /auth/logout
authRoutes.post('/auth/logout', requireAuth, async (c) => {
  await destroySession(c.get('sessionId'));
  clearSessionCookie(c);
  return c.json({ message: '로그아웃 되었습니다' });
});

// GET /auth/me
authRoutes.get('/auth/me', requireAuth, async (c) => {
  const user = await getUserWithOAuths(c.get('user').id);

  if (!user) {
    throw new UserNotFoundException();
  }

  return c.json(user);
});

// DELETE /auth/me — 회원 탈퇴
authRoutes.delete('/auth/me', requireAuth, async (c) => {
  await softDeleteUser(c.get('user').id);
  await destroySession(c.get('sessionId'));
  clearSessionCookie(c);
  return c.json({ message: '탈퇴 처리되었습니다' });
});

// GET /auth/:provider — OAuth 로그인 리다이렉트
authRoutes.get('/auth/:provider', (c) => {
  const strategy = getStrategy(c.req.param('provider'));
  return c.redirect(strategy.buildAuthUrl(), 302);
});

// GET /auth/:provider/callback — OAuth 콜백
authRoutes.get(
  '/auth/:provider/callback',
  zValidator('query', OAuthCallbackQuerySchema),
  async (c) => {
    const strategy = getStrategy(c.req.param('provider'));
    const { code } = c.req.valid('query');
    const log = c.get('logger');

    const { accessToken } = await strategy.exchangeCode(code);
    const userInfo = await strategy.fetchUserInfo(accessToken);

    const { id, email, isNew } = await findOrCreateUserByOAuth({
      provider: strategy.provider,
      ...userInfo,
    });

    const sessionId = await createSession({ id, email });
    setSessionCookie(c, sessionId);
    log.info('User logged in', { userId: id, isNew, provider: strategy.provider });

    return c.redirect(`http://localhost:${env.WEB_PORT}`, 302);
  },
);
