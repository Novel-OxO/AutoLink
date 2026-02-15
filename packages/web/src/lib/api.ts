import type { UserResponse } from '@autolink/shared';

import { useWorkspaceStore } from '@/features/workspace';

import { WORKSPACE_ID_HEADER_NAME } from './constants';
import { env } from './env';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

interface UserWorkspace {
  id: number;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

export type User = UserResponse & {
  workspaces: UserWorkspace[];
  defaultWorkspaceId: number | null;
};

function getWorkspaceRequestHeader(): Record<string, string> {
  const { activeWorkspaceId, defaultWorkspaceId } = useWorkspaceStore.getState();
  const workspaceId = activeWorkspaceId ?? defaultWorkspaceId;

  if (workspaceId === null) {
    return {};
  }

  return { [WORKSPACE_ID_HEADER_NAME]: String(workspaceId) };
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = env.apiUrl;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...getWorkspaceRequestHeader(),
        ...options.headers,
      },
      credentials: 'include', // 쿠키 자동 포함
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // 인증 실패 시 처리
        throw new Error('UNAUTHORIZED');
      }
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST 요청
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // 인증 관련 API
  async getAuthUser(): Promise<User> {
    return this.get<User>('/auth/me');
  }

  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/auth/logout');
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.delete<{ message: string }>('/auth/me');
  }
}

export const apiClient = new ApiClient();
