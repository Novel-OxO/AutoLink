import type { WorkspaceRole } from '@autolink/shared/types';

import { prisma, withTransaction } from '@/shared/lib/prisma';

import type {
  AcceptWorkspaceInviteRecordInput,
  CreateWorkspaceInviteRecordInput,
  CreateWorkspaceRecordInput,
  UpdateWorkspaceRecordInput,
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceMemberRoleRecord,
  WorkspaceMembershipRecord,
  WorkspaceSummaryRecord,
} from './workspace.repository.types';

export type {
  WorkspaceInviteRecord,
  WorkspaceMemberRecord,
  WorkspaceMemberRoleRecord,
  WorkspaceMembershipRecord,
  WorkspaceSummaryRecord,
};

export async function createWorkspaceWithAdmin(
  userId: number,
  input: CreateWorkspaceRecordInput,
): Promise<WorkspaceSummaryRecord> {
  return withTransaction(async (tx) => {
    const workspace = await tx.workspace.create({
      data: {
        name: input.name,
        description: input.description ?? null,
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
      },
    });

    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId,
        role: 'ADMIN',
      },
    });

    return {
      ...workspace,
      role: 'ADMIN',
      memberCount: 1,
    };
  });
}

export async function listUserWorkspaces(userId: number): Promise<WorkspaceSummaryRecord[]> {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId },
    orderBy: { joinedAt: 'asc' },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((membership) => ({
    id: membership.workspace.id,
    name: membership.workspace.name,
    description: membership.workspace.description,
    createdAt: membership.workspace.createdAt,
    role: membership.role,
    memberCount: membership.workspace._count.members,
  }));
}

export async function getWorkspaceSummaryForUser(
  workspaceId: number,
  userId: number,
): Promise<WorkspaceSummaryRecord | null> {
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          _count: {
            select: {
              members: true,
            },
          },
        },
      },
    },
  });

  if (!membership) {
    return null;
  }

  return {
    id: membership.workspace.id,
    name: membership.workspace.name,
    description: membership.workspace.description,
    createdAt: membership.workspace.createdAt,
    role: membership.role,
    memberCount: membership.workspace._count.members,
  };
}

export async function findWorkspaceMembership(
  workspaceId: number,
  userId: number,
): Promise<WorkspaceMembershipRecord | null> {
  return prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      workspaceId: true,
      role: true,
    },
  });
}

export async function existsWorkspace(workspaceId: number): Promise<boolean> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });

  return workspace !== null;
}

export async function updateWorkspace(
  workspaceId: number,
  input: UpdateWorkspaceRecordInput,
): Promise<void> {
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      name: input.name,
      description: input.description,
    },
  });
}

export async function deleteWorkspace(workspaceId: number): Promise<void> {
  await prisma.workspace.delete({
    where: { id: workspaceId },
  });
}

export async function listWorkspaceMembers(workspaceId: number): Promise<WorkspaceMemberRecord[]> {
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId },
    orderBy: { joinedAt: 'asc' },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          nickname: true,
          email: true,
        },
      },
    },
  });

  return members.map((member) => ({
    userId: member.userId,
    nickname: member.user.nickname,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
}

export async function findWorkspaceMember(
  workspaceId: number,
  userId: number,
): Promise<WorkspaceMemberRecord | null> {
  const member = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    select: {
      userId: true,
      role: true,
      joinedAt: true,
      user: {
        select: {
          nickname: true,
          email: true,
        },
      },
    },
  });

  if (!member) {
    return null;
  }

  return {
    userId: member.userId,
    nickname: member.user.nickname,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  };
}

export async function findWorkspaceMemberByEmail(
  workspaceId: number,
  email: string,
): Promise<WorkspaceMemberRoleRecord | null> {
  return prisma.workspaceMember.findFirst({
    where: {
      workspaceId,
      user: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    },
    select: {
      userId: true,
      role: true,
    },
  });
}

export async function countWorkspaceAdmins(workspaceId: number): Promise<number> {
  return prisma.workspaceMember.count({
    where: {
      workspaceId,
      role: 'ADMIN',
    },
  });
}

export async function updateWorkspaceMemberRole(
  workspaceId: number,
  userId: number,
  role: WorkspaceRole,
): Promise<WorkspaceMemberRoleRecord> {
  return prisma.workspaceMember.update({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
    data: { role },
    select: {
      userId: true,
      role: true,
    },
  });
}

export async function deleteWorkspaceMember(workspaceId: number, userId: number): Promise<void> {
  await prisma.workspaceMember.delete({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId,
      },
    },
  });
}

export async function findPendingWorkspaceInvite(
  workspaceId: number,
  email: string,
): Promise<WorkspaceInviteRecord | null> {
  const invite = await prisma.workspaceInvite.findFirst({
    where: {
      workspaceId,
      email: {
        equals: email,
        mode: 'insensitive',
      },
      status: 'PENDING',
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return null;
  }

  return {
    id: invite.id,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export async function createWorkspaceInvite(
  input: CreateWorkspaceInviteRecordInput,
): Promise<WorkspaceInviteRecord> {
  const invite = await prisma.workspaceInvite.create({
    data: {
      workspaceId: input.workspaceId,
      email: input.email,
      role: input.role,
      token: input.token,
      expiresAt: input.expiresAt,
    },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  return {
    id: invite.id,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export async function findWorkspaceInviteByToken(
  token: string,
): Promise<WorkspaceInviteRecord | null> {
  const invite = await prisma.workspaceInvite.findUnique({
    where: { token },
    select: {
      id: true,
      workspaceId: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      workspace: {
        select: {
          name: true,
        },
      },
    },
  });

  if (!invite) {
    return null;
  }

  return {
    id: invite.id,
    workspaceId: invite.workspaceId,
    workspaceName: invite.workspace.name,
    email: invite.email,
    role: invite.role,
    status: invite.status,
    expiresAt: invite.expiresAt,
  };
}

export async function expireWorkspaceInvite(inviteId: number): Promise<void> {
  await prisma.workspaceInvite.update({
    where: { id: inviteId },
    data: { status: 'EXPIRED' },
  });
}

export async function acceptWorkspaceInvite(
  input: AcceptWorkspaceInviteRecordInput,
): Promise<boolean> {
  return withTransaction(async (tx) => {
    const updated = await tx.workspaceInvite.updateMany({
      where: {
        id: input.inviteId,
        status: 'PENDING',
      },
      data: {
        status: 'ACCEPTED',
      },
    });

    if (updated.count === 0) {
      return false;
    }

    await tx.workspaceMember.upsert({
      where: {
        workspaceId_userId: {
          workspaceId: input.workspaceId,
          userId: input.userId,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        userId: input.userId,
        role: input.role,
      },
      update: {},
    });

    return true;
  });
}
