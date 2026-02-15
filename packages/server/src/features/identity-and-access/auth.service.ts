import { constVoid, pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';

import {
  WorkspaceAccessDeniedException,
  WorkspaceHeaderInvalidException,
} from '@/shared/errors/auth.error';

import * as repo from './auth.repository';

// TODO 헤더 파싱은 공용 모듈로 추출
function parseWorkspaceIdHeader(workspaceIdHeader?: string): number | null {
  if (!workspaceIdHeader) {
    return null;
  }

  const parsedWorkspaceId = Number(workspaceIdHeader);
  if (!Number.isInteger(parsedWorkspaceId) || parsedWorkspaceId <= 0) {
    throw new WorkspaceHeaderInvalidException();
  }

  return parsedWorkspaceId;
}

export async function findOrCreateUserByOAuth(params: {
  provider: Parameters<typeof repo.findByOAuth>[0];
  providerId: string;
  email: string;
  nickname: string;
  profileImage: string | null;
}): Promise<repo.FindOrCreateResult> {
  const { provider, providerId, email, nickname, profileImage } = params;

  return (
    (await repo.findByOAuth(provider, providerId)) ??
    (await repo.findByEmailAndLinkOAuth(email, provider, providerId)) ??
    (await repo.createUserWithOAuth({ email, nickname, profileImage }, provider, providerId))
  );
}

export function getUserWithOAuths(userId: number, workspaceIdHeader?: string) {
  const requestedWorkspaceId = parseWorkspaceIdHeader(workspaceIdHeader);

  return pipe(
    () => repo.findUserWithOAuths(userId),
    T.map((user) => {
      if (!user) {
        return null;
      }

      const workspaces = user.workspaceMembers.map((workspaceMember) => ({
        id: workspaceMember.workspace.id,
        name: workspaceMember.workspace.name,
        role: workspaceMember.role,
      }));
      const defaultWorkspaceId = workspaces[0]?.id ?? null;

      if (
        requestedWorkspaceId !== null &&
        !workspaces.some((workspace) => workspace.id === requestedWorkspaceId)
      ) {
        throw new WorkspaceAccessDeniedException();
      }

      return {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        profileImage: user.profileImage,
        profilePublic: user.profilePublic,
        oauths: user.oauths.map((o) => ({
          provider: o.provider,
          connectedAt: o.createdAt.toISOString(),
        })),
        workspaces,
        defaultWorkspaceId,
        createdAt: user.createdAt.toISOString(),
      };
    }),
  )();
}

export function softDeleteUser(userId: number): Promise<void> {
  return pipe(() => repo.markUserDeleted(userId), T.map(constVoid))();
}
