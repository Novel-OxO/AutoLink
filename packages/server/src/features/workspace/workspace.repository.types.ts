import type { InviteStatus, WorkspaceRole } from '@autolink/shared/types';

export interface CreateWorkspaceRecordInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceRecordInput {
  name?: string;
  description?: string | null;
}

export interface WorkspaceSummaryRecord {
  id: number;
  name: string;
  description: string | null;
  role: WorkspaceRole;
  memberCount: number;
  createdAt: Date;
}

export interface WorkspaceMembershipRecord {
  workspaceId: number;
  role: WorkspaceRole;
}

export interface WorkspaceMemberRecord {
  userId: number;
  nickname: string;
  email: string;
  role: WorkspaceRole;
  joinedAt: Date;
}

export interface WorkspaceMemberRoleRecord {
  userId: number;
  role: WorkspaceRole;
}

export interface CreateWorkspaceInviteRecordInput {
  workspaceId: number;
  email: string;
  role: WorkspaceRole;
  token: string;
  expiresAt: Date;
}

export interface WorkspaceInviteRecord {
  id: number;
  workspaceId: number;
  workspaceName: string;
  email: string;
  role: WorkspaceRole;
  status: InviteStatus;
  expiresAt: Date;
}

export interface AcceptWorkspaceInviteRecordInput {
  inviteId: number;
  workspaceId: number;
  userId: number;
  role: WorkspaceRole;
}
