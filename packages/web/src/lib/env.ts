/**
 * 환경변수 관리 유틸리티
 */

export const env = {
  /** 서버 기본 URL */
  get serverUrl(): string {
    return process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3001';
  },

  /** Google OAuth 로그인 URL */
  get googleAuthUrl(): string {
    return `${this.serverUrl}/auth/google`;
  },

  /** API 기본 URL */
  get apiUrl(): string {
    return `${this.serverUrl}/api`;
  },
};
