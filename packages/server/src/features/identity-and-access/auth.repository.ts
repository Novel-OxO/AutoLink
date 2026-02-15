import type { OAuthProvider } from '@autolink/shared/types';

import { prisma, withTransaction } from '@/shared/lib/prisma';

import type { FindOrCreateResult } from './auth.repository.types';

export type { FindOrCreateResult };

export function findUserWithOAuths(userId: number) {
  return prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    include: {
      oauths: { select: { provider: true, createdAt: true } },
      workspaceMembers: {
        select: {
          role: true,
          joinedAt: true,
          workspace: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });
}

export function markUserDeleted(userId: number) {
  return prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  });
}

export async function findByOAuth(
  provider: OAuthProvider,
  providerId: string,
): Promise<FindOrCreateResult | null> {
  const found = await prisma.oAuth.findUnique({
    where: { provider_providerId: { provider, providerId } },
    include: { user: true },
  });
  if (!found) return null;

  if (found.user.deletedAt) {
    await prisma.user.update({
      where: { id: found.user.id },
      data: { deletedAt: null },
    });
  }

  return { id: found.user.id, email: found.user.email, isNew: false };
}

export async function findByEmailAndLinkOAuth(
  email: string,
  provider: OAuthProvider,
  providerId: string,
): Promise<FindOrCreateResult | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  if (user.deletedAt) {
    await withTransaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { deletedAt: null },
      });
      await tx.oAuth.create({
        data: { userId: user.id, provider, providerId },
      });
    });
  } else {
    await prisma.oAuth.create({
      data: { userId: user.id, provider, providerId },
    });
  }

  return { id: user.id, email: user.email, isNew: false };
}

export async function createUserWithOAuth(
  data: { email: string; nickname: string; profileImage: string | null },
  provider: OAuthProvider,
  providerId: string,
): Promise<FindOrCreateResult> {
  const user = await withTransaction(async (tx) => {
    const created = await tx.user.create({ data });
    await tx.oAuth.create({
      data: { userId: created.id, provider, providerId },
    });
    const workspace = await tx.workspace.create({
      data: {
        name: `${data.nickname}의 워크스페이스`,
      },
    });
    await tx.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: created.id,
        role: 'ADMIN',
      },
    });

    return created;
  });

  return { id: user.id, email: user.email, isNew: true };
}
