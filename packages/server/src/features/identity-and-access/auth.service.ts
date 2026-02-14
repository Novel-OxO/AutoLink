import { constVoid, pipe } from 'fp-ts/function';
import * as T from 'fp-ts/Task';

import * as repo from './auth.repository';

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

export function getUserWithOAuths(userId: number) {
  return pipe(
    () => repo.findUserWithOAuths(userId),
    T.map((user) =>
      user
        ? {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            profileImage: user.profileImage,
            profilePublic: user.profilePublic,
            oauths: user.oauths.map((o) => ({
              provider: o.provider,
              connectedAt: o.createdAt.toISOString(),
            })),
            createdAt: user.createdAt.toISOString(),
          }
        : null,
    ),
  )();
}

export function softDeleteUser(userId: number): Promise<void> {
  return pipe(() => repo.markUserDeleted(userId), T.map(constVoid))();
}
