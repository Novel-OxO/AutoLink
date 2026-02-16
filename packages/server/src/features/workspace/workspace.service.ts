import { randomUUID } from 'node:crypto';

import { INVITE_EXPIRY_DAYS } from '@autolink/shared/constants';
import type {
  AcceptInviteResponse,
  CreateInvite,
  CreateWorkspace,
  InviteResponse,
  UpdateMemberRole,
  UpdateWorkspace,
  WorkspaceMemberResponse,
  WorkspaceResponse,
} from '@autolink/shared/types';

import {
  WorkspaceAdminRequiredException,
  WorkspaceInviteAlreadyAcceptedException,
  WorkspaceInviteAlreadyPendingException,
  WorkspaceInviteEmailMismatchException,
  WorkspaceInviteExpiredException,
  WorkspaceInviteNotFoundException,
  WorkspaceLastAdminException,
  WorkspaceMemberAlreadyExistsException,
  WorkspaceMemberNotFoundException,
  WorkspaceNotFoundException,
  WorkspacePermissionDeniedException,
} from '@/shared/errors';

import * as repo from './workspace.repository';

function toWorkspaceResponse(workspace: repo.WorkspaceSummaryRecord): WorkspaceResponse {
  return {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description,
    role: workspace.role,
    memberCount: workspace.memberCount,
    createdAt: workspace.createdAt.toISOString(),
  };
}

function toWorkspaceMemberResponse(member: repo.WorkspaceMemberRecord): WorkspaceMemberResponse {
  return {
    userId: member.userId,
    nickname: member.nickname,
    email: member.email,
    role: member.role,
    joinedAt: member.joinedAt.toISOString(),
  };
}

function toInviteResponse(invite: repo.WorkspaceInviteRecord): InviteResponse {
  return {
    inviteId: invite.id,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt.toISOString(),
  };
}

async function ensureWorkspaceMember(
  workspaceId: number,
  userId: number,
): Promise<repo.WorkspaceMembershipRecord> {
  const membership = await repo.findWorkspaceMembership(workspaceId, userId);
  if (membership) {
    return membership;
  }

  const exists = await repo.existsWorkspace(workspaceId);
  if (!exists) {
    throw new WorkspaceNotFoundException();
  }

  throw new WorkspacePermissionDeniedException();
}

async function ensureWorkspaceAdmin(workspaceId: number, userId: number) {
  const membership = await ensureWorkspaceMember(workspaceId, userId);

  if (membership.role !== 'ADMIN') {
    throw new WorkspaceAdminRequiredException();
  }

  return membership;
}

async function ensureNotLastAdmin(workspaceId: number): Promise<void> {
  const adminCount = await repo.countWorkspaceAdmins(workspaceId);
  if (adminCount <= 1) {
    throw new WorkspaceLastAdminException();
  }
}

export async function createWorkspace(
  userId: number,
  input: CreateWorkspace,
): Promise<WorkspaceResponse> {
  const workspace = await repo.createWorkspaceWithAdmin(userId, input);
  return toWorkspaceResponse(workspace);
}

export async function listWorkspaces(userId: number): Promise<{ data: WorkspaceResponse[] }> {
  const workspaces = await repo.listUserWorkspaces(userId);
  return {
    data: workspaces.map(toWorkspaceResponse),
  };
}

export async function updateWorkspace(
  userId: number,
  workspaceId: number,
  input: UpdateWorkspace,
): Promise<WorkspaceResponse> {
  await ensureWorkspaceAdmin(workspaceId, userId);
  await repo.updateWorkspace(workspaceId, input);

  const updatedWorkspace = await repo.getWorkspaceSummaryForUser(workspaceId, userId);
  if (!updatedWorkspace) {
    throw new WorkspaceNotFoundException();
  }

  return toWorkspaceResponse(updatedWorkspace);
}

export async function deleteWorkspace(userId: number, workspaceId: number): Promise<void> {
  await ensureWorkspaceAdmin(workspaceId, userId);
  await repo.deleteWorkspace(workspaceId);
}

export async function listWorkspaceMembers(
  userId: number,
  workspaceId: number,
): Promise<{ data: WorkspaceMemberResponse[] }> {
  await ensureWorkspaceMember(workspaceId, userId);

  const members = await repo.listWorkspaceMembers(workspaceId);
  return {
    data: members.map(toWorkspaceMemberResponse),
  };
}

export async function updateWorkspaceMemberRole(
  actorUserId: number,
  workspaceId: number,
  targetUserId: number,
  input: UpdateMemberRole,
): Promise<{ userId: number; role: UpdateMemberRole['role'] }> {
  await ensureWorkspaceAdmin(workspaceId, actorUserId);

  const targetMember = await repo.findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    throw new WorkspaceMemberNotFoundException();
  }

  if (targetMember.role === 'ADMIN' && input.role === 'MEMBER') {
    await ensureNotLastAdmin(workspaceId);
  }

  const updatedMember = await repo.updateWorkspaceMemberRole(workspaceId, targetUserId, input.role);
  return {
    userId: updatedMember.userId,
    role: updatedMember.role,
  };
}

export async function removeWorkspaceMember(
  actorUserId: number,
  workspaceId: number,
  targetUserId: number,
): Promise<void> {
  await ensureWorkspaceAdmin(workspaceId, actorUserId);

  const targetMember = await repo.findWorkspaceMember(workspaceId, targetUserId);
  if (!targetMember) {
    throw new WorkspaceMemberNotFoundException();
  }

  if (targetMember.role === 'ADMIN') {
    await ensureNotLastAdmin(workspaceId);
  }

  await repo.deleteWorkspaceMember(workspaceId, targetUserId);
}

export async function createWorkspaceInvite(
  actorUserId: number,
  workspaceId: number,
  input: CreateInvite,
): Promise<InviteResponse> {
  await ensureWorkspaceAdmin(workspaceId, actorUserId);

  const normalizedEmail = input.email.trim().toLowerCase();

  const existingMember = await repo.findWorkspaceMemberByEmail(workspaceId, normalizedEmail);
  if (existingMember) {
    throw new WorkspaceMemberAlreadyExistsException();
  }

  const pendingInvite = await repo.findPendingWorkspaceInvite(workspaceId, normalizedEmail);
  if (pendingInvite) {
    throw new WorkspaceInviteAlreadyPendingException();
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

  const invite = await repo.createWorkspaceInvite({
    workspaceId,
    email: normalizedEmail,
    role: input.role ?? 'MEMBER',
    token: randomUUID(),
    expiresAt,
  });

  return toInviteResponse(invite);
}

export async function acceptWorkspaceInvite(
  userId: number,
  userEmail: string,
  inviteToken: string,
): Promise<AcceptInviteResponse> {
  const invite = await repo.findWorkspaceInviteByToken(inviteToken);
  if (!invite) {
    throw new WorkspaceInviteNotFoundException();
  }

  if (invite.status === 'ACCEPTED') {
    throw new WorkspaceInviteAlreadyAcceptedException();
  }

  if (invite.status === 'EXPIRED') {
    throw new WorkspaceInviteExpiredException();
  }

  const now = new Date();
  if (invite.expiresAt <= now) {
    await repo.expireWorkspaceInvite(invite.id);
    throw new WorkspaceInviteExpiredException();
  }

  if (invite.email.toLowerCase() !== userEmail.toLowerCase()) {
    throw new WorkspaceInviteEmailMismatchException();
  }

  const membership = await repo.findWorkspaceMembership(invite.workspaceId, userId);
  if (membership) {
    throw new WorkspaceMemberAlreadyExistsException();
  }

  const accepted = await repo.acceptWorkspaceInvite({
    inviteId: invite.id,
    workspaceId: invite.workspaceId,
    userId,
    role: invite.role,
  });

  if (!accepted) {
    throw new WorkspaceInviteAlreadyAcceptedException();
  }

  return {
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspaceName,
    role: invite.role,
  };
}
