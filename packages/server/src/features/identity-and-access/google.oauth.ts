import { OAuthFailedException } from '@/shared/errors/auth.error';
import { env } from '@/shared/lib/env';

import type { OAuthStrategy, OAuthUserInfo } from './oauth.strategy';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  picture?: string;
}

export function createGoogleOAuth(): OAuthStrategy {
  const clientId = env.GOOGLE_CLIENT_ID;
  const clientSecret = env.GOOGLE_CLIENT_SECRET;
  const callbackUrl = env.GOOGLE_CALLBACK_URL;

  if (!clientId || !clientSecret || !callbackUrl) {
    throw new Error('Google OAuth is not configured');
  }

  return {
    provider: 'GOOGLE',

    buildAuthUrl() {
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        redirect_uri: callbackUrl,
        scope: 'openid email profile',
        access_type: 'online',
      });
      return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    },

    async exchangeCode(code: string) {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
      });

      const res = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!res.ok) {
        throw new OAuthFailedException();
      }

      const data = (await res.json()) as { access_token?: string };
      if (!data.access_token) {
        throw new OAuthFailedException();
      }

      return { accessToken: data.access_token };
    },

    async fetchUserInfo(accessToken: string): Promise<OAuthUserInfo> {
      const res = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new OAuthFailedException('Failed to fetch user profile');
      }

      const data = (await res.json()) as GoogleUserInfo;
      if (!data.id || !data.email) {
        throw new OAuthFailedException('Failed to fetch user profile');
      }

      return {
        providerId: data.id,
        email: data.email,
        nickname: data.given_name || data.name,
        profileImage: data.picture || null,
      };
    },
  };
}
