import type { OAuthProvider } from '@autolink/shared/types';

export interface OAuthUserInfo {
  providerId: string;
  email: string;
  nickname: string;
  profileImage: string | null;
}

export interface OAuthStrategy {
  readonly provider: OAuthProvider;
  buildAuthUrl(): string;
  exchangeCode(code: string): Promise<{ accessToken: string }>;
  fetchUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}
