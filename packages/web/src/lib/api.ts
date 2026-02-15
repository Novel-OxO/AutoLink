import type {
  AcceptInviteResponse,
  CreateInvite,
  CreateWorkspace,
  InviteResponse,
  UpdateMemberRole,
  UpdateWorkspace,
  UserResponse,
  WorkspaceMemberResponse,
  WorkspaceResponse,
  WorkspaceRole,
} from "@autolink/shared/types";

import { useWorkspaceStore } from "@/features/workspace/stores/workspace.store";

import { WORKSPACE_ID_HEADER_NAME } from "./constants";
import { env } from "./env";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

interface UserWorkspace {
  id: number;
  name: string;
  role: WorkspaceRole;
}

interface ApiErrorPayload {
  message?: string;
  errorCode?: string;
}

type WorkspaceListResponse = { data: WorkspaceResponse[] };
type WorkspaceMembersResponse = { data: WorkspaceMemberResponse[] };
type WorkspaceMemberRoleResponse = { userId: number; role: WorkspaceRole };
type MessageResponse = { message: string };
export type User = UserResponse & {
  workspaces: UserWorkspace[];
  defaultWorkspaceId: number | null;
};

function getWorkspaceRequestHeader(): Record<string, string> {
  const { activeWorkspaceId, defaultWorkspaceId } =
    useWorkspaceStore.getState();
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

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...getWorkspaceRequestHeader(),
        ...options.headers,
      },
      credentials: "include", // 쿠키 자동 포함
      ...options,
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // 인증 실패 시 처리
        throw new Error("UNAUTHORIZED");
      }

      let errorPayload: ApiErrorPayload | null = null;

      try {
        errorPayload = (await response.json()) as ApiErrorPayload;
      } catch {
        errorPayload = null;
      }

      if (errorPayload?.errorCode) {
        throw new Error(errorPayload.errorCode);
      }

      if (errorPayload?.message) {
        throw new Error(errorPayload.message);
      }

      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // GET 요청
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  // POST 요청
  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE 요청
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // PATCH 요청
  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // 인증 관련 API
  async getAuthUser(): Promise<User> {
    return this.get<User>("/auth/me");
  }

  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>("/auth/logout");
  }

  async deleteAccount(): Promise<{ message: string }> {
    return this.delete<{ message: string }>("/auth/me");
  }

  // 워크스페이스 관련 API
  async listWorkspaces(): Promise<WorkspaceListResponse> {
    return this.get<WorkspaceListResponse>("/workspaces");
  }

  async createWorkspace(data: CreateWorkspace): Promise<WorkspaceResponse> {
    return this.post<WorkspaceResponse>("/workspaces", data);
  }

  async updateWorkspace(
    workspaceId: number,
    data: UpdateWorkspace,
  ): Promise<WorkspaceResponse> {
    return this.patch<WorkspaceResponse>(`/workspaces/${workspaceId}`, data);
  }

  async deleteWorkspace(workspaceId: number): Promise<MessageResponse> {
    return this.delete<MessageResponse>(`/workspaces/${workspaceId}`);
  }

  async listWorkspaceMembers(
    workspaceId: number,
  ): Promise<WorkspaceMembersResponse> {
    return this.get<WorkspaceMembersResponse>(
      `/workspaces/${workspaceId}/members`,
    );
  }

  async updateWorkspaceMemberRole(
    workspaceId: number,
    userId: number,
    data: UpdateMemberRole,
  ): Promise<WorkspaceMemberRoleResponse> {
    return this.patch<WorkspaceMemberRoleResponse>(
      `/workspaces/${workspaceId}/members/${userId}`,
      data,
    );
  }

  async removeWorkspaceMember(
    workspaceId: number,
    userId: number,
  ): Promise<MessageResponse> {
    return this.delete<MessageResponse>(
      `/workspaces/${workspaceId}/members/${userId}`,
    );
  }

  async createWorkspaceInvite(
    workspaceId: number,
    data: CreateInvite,
  ): Promise<InviteResponse> {
    return this.post<InviteResponse>(`/workspaces/${workspaceId}/invite`, data);
  }

  async acceptWorkspaceInvite(
    inviteToken: string,
  ): Promise<AcceptInviteResponse> {
    return this.post<AcceptInviteResponse>(`/invites/${inviteToken}/accept`);
  }
}

export const apiClient = new ApiClient();
