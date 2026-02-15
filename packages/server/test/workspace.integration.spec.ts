import Redis from 'ioredis';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OAuthStrategy } from '@/features/identity-and-access/oauth.strategy';
import type { PrismaClient as PrismaClientType } from '@/generated/prisma/client';

import {
  getPostgresUrl,
  getRedisUrl,
  startContainers,
  stopContainers,
  type TestContainers,
} from './helpers/containers';
import { cleanDatabase, createTestPrismaClient } from './helpers/prisma-test-client';

let testPrisma: PrismaClientType;
let testRedis: Redis;

vi.mock('@/shared/lib/prisma', () => ({
  get prisma() {
    return testPrisma;
  },
  connectPrisma: vi.fn(),
  disconnectPrisma: vi.fn(),
  withTransaction: vi.fn(async (fn: any, options?: any) => {
    return testPrisma.$transaction(fn, options);
  }),
  withRetryTransaction: vi.fn(async (fn: any, options?: any) => {
    return testPrisma.$transaction(fn, options);
  }),
}));

vi.mock('@/shared/lib/redis', () => ({
  get redis() {
    return testRedis;
  },
  withLock: vi.fn(async (_key: string, fn: () => any) => fn()),
  withCache: vi.fn(async (_key: string, fn: () => any) => fn()),
  invalidateCache: vi.fn(),
}));

type MockOAuthUser = {
  providerId: string;
  email: string;
  nickname: string;
  profileImage: string | null;
};

const oauthUsers = {
  owner: {
    providerId: 'google-owner-001',
    email: 'owner@example.com',
    nickname: 'Owner',
    profileImage: 'https://example.com/owner.jpg',
  },
  member: {
    providerId: 'google-member-001',
    email: 'member@example.com',
    nickname: 'Member',
    profileImage: 'https://example.com/member.jpg',
  },
  outsider: {
    providerId: 'google-outsider-001',
    email: 'outsider@example.com',
    nickname: 'Outsider',
    profileImage: 'https://example.com/outsider.jpg',
  },
} satisfies Record<string, MockOAuthUser>;

const mockStrategy: OAuthStrategy = {
  provider: 'GOOGLE',
  buildAuthUrl: vi.fn(() => 'https://accounts.google.com/mock-auth-url'),
  exchangeCode: vi.fn(async () => ({ accessToken: 'mock-access-token' })),
  fetchUserInfo: vi.fn(async () => oauthUsers.owner),
};

vi.mock('@/features/identity-and-access/google.oauth', () => ({
  createGoogleOAuth: () => mockStrategy,
}));

let containers: TestContainers;
let createApp: typeof import('@/app').createApp;

beforeAll(async () => {
  containers = await startContainers();

  const postgresUrl = getPostgresUrl(containers.postgres);
  testPrisma = await createTestPrismaClient(postgresUrl);

  const redisUrl = getRedisUrl(containers.redis);
  testRedis = new Redis(redisUrl);

  const appModule = await import('@/app');
  createApp = appModule.createApp;
}, 120_000);

afterAll(async () => {
  await testPrisma?.$disconnect();
  testRedis?.disconnect();
  await stopContainers(containers);
});

beforeEach(async () => {
  await cleanDatabase(testPrisma);
  await testRedis.flushdb();
  vi.clearAllMocks();

  (mockStrategy.exchangeCode as ReturnType<typeof vi.fn>).mockResolvedValue({
    accessToken: 'mock-access-token',
  });
  (mockStrategy.fetchUserInfo as ReturnType<typeof vi.fn>).mockResolvedValue(oauthUsers.owner);
});

function makeApp() {
  return createApp();
}

function extractSessionCookie(response: Response): string | null {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return null;

  const match = setCookie.match(/autolink_sid=([^;]+)/);
  return match ? match[1] : null;
}

function authCookie(sessionId: string): string {
  return `autolink_sid=${sessionId}`;
}

function jsonHeaders(sessionId: string) {
  return {
    Cookie: authCookie(sessionId),
    'Content-Type': 'application/json',
  };
}

async function jsonBody<T = Record<string, unknown>>(res: Response): Promise<T> {
  return res.json() as Promise<T>;
}

async function loginWithUser(app: ReturnType<typeof makeApp>, user: MockOAuthUser, code: string) {
  (mockStrategy.fetchUserInfo as ReturnType<typeof vi.fn>).mockResolvedValueOnce(user);

  const loginRes = await app.request(`/auth/google/callback?code=${code}`);
  expect(loginRes.status).toBe(302);

  const sessionId = extractSessionCookie(loginRes);
  expect(sessionId).toBeTruthy();

  return sessionId as string;
}

async function createWorkspaceByApi(
  app: ReturnType<typeof makeApp>,
  sessionId: string,
  name: string,
) {
  const res = await app.request('/workspaces', {
    method: 'POST',
    headers: jsonHeaders(sessionId),
    body: JSON.stringify({ name }),
  });

  expect(res.status).toBe(201);

  return jsonBody<{ id: number }>(res);
}

describe('Workspace 통합 테스트', () => {
  it('POST /workspaces는 워크스페이스와 ADMIN 멤버십을 생성한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-create-owner');

    const createRes = await app.request('/workspaces', {
      method: 'POST',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({
        name: '팀 지식 베이스',
        description: '백엔드 팀 문서',
      }),
    });

    expect(createRes.status).toBe(201);
    const body = await jsonBody<{
      id: number;
      name: string;
      description: string | null;
      role: string;
      memberCount: number;
    }>(createRes);

    expect(body.name).toBe('팀 지식 베이스');
    expect(body.description).toBe('백엔드 팀 문서');
    expect(body.role).toBe('ADMIN');
    expect(body.memberCount).toBe(1);

    const createdWorkspace = await testPrisma.workspace.findUnique({
      where: { id: body.id },
      include: { members: true },
    });

    expect(createdWorkspace).toBeTruthy();
    expect(createdWorkspace?.members).toHaveLength(1);
    expect(createdWorkspace?.members[0].role).toBe('ADMIN');
  });

  it('GET /workspaces는 내가 속한 워크스페이스만 반환한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-list-owner');

    await createWorkspaceByApi(app, ownerSessionId, 'Owner Team');

    const outsiderUser = await testPrisma.user.create({
      data: {
        email: 'other@example.com',
        nickname: 'Other User',
      },
    });
    const outsiderWorkspace = await testPrisma.workspace.create({
      data: { name: 'Other Workspace' },
    });
    await testPrisma.workspaceMember.create({
      data: {
        workspaceId: outsiderWorkspace.id,
        userId: outsiderUser.id,
        role: 'ADMIN',
      },
    });

    const listRes = await app.request('/workspaces', {
      headers: { Cookie: authCookie(ownerSessionId) },
    });

    expect(listRes.status).toBe(200);
    const body = await jsonBody<{ data: Array<{ name: string }> }>(listRes);

    expect(body.data.map((workspace) => workspace.name)).toContain('Owner Team');
    expect(body.data.map((workspace) => workspace.name)).not.toContain('Other Workspace');
  });

  it('PATCH /workspaces/:workspaceId는 ADMIN만 수정할 수 있다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-patch-owner');
    const memberSessionId = await loginWithUser(app, oauthUsers.member, 'ws-patch-member');

    const workspace = await createWorkspaceByApi(app, ownerSessionId, 'Editable Workspace');

    const member = await testPrisma.user.findUnique({
      where: { email: oauthUsers.member.email },
      select: { id: true },
    });
    await testPrisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: member!.id,
        role: 'MEMBER',
      },
    });

    const patchRes = await app.request(`/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({
        name: 'Renamed Workspace',
      }),
    });

    expect(patchRes.status).toBe(200);

    const forbiddenRes = await app.request(`/workspaces/${workspace.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(memberSessionId),
      body: JSON.stringify({
        name: 'Member Cannot Update',
      }),
    });

    expect(forbiddenRes.status).toBe(403);
    const forbiddenBody = await jsonBody<{ errorCode: string }>(forbiddenRes);
    expect(forbiddenBody.errorCode).toBe('WORKSPACE_ADMIN_REQUIRED');
  });

  it('DELETE /workspaces/:workspaceId는 워크스페이스를 삭제한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-delete-owner');

    const workspace = await createWorkspaceByApi(app, ownerSessionId, 'Delete Workspace');

    const deleteRes = await app.request(`/workspaces/${workspace.id}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie(ownerSessionId) },
    });

    expect(deleteRes.status).toBe(200);
    const body = await jsonBody<{ message: string }>(deleteRes);
    expect(body.message).toBe('워크스페이스가 삭제되었습니다');

    const deleted = await testPrisma.workspace.findUnique({
      where: { id: workspace.id },
    });
    expect(deleted).toBeNull();
  });

  it('GET /workspaces/:workspaceId/members는 멤버에게 목록을 반환한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-members-owner');
    const memberSessionId = await loginWithUser(app, oauthUsers.member, 'ws-members-member');

    const workspace = await createWorkspaceByApi(app, ownerSessionId, 'Member Workspace');

    const member = await testPrisma.user.findUnique({
      where: { email: oauthUsers.member.email },
      select: { id: true },
    });
    await testPrisma.workspaceMember.create({
      data: {
        workspaceId: workspace.id,
        userId: member!.id,
        role: 'MEMBER',
      },
    });

    const membersRes = await app.request(`/workspaces/${workspace.id}/members`, {
      headers: { Cookie: authCookie(memberSessionId) },
    });

    expect(membersRes.status).toBe(200);
    const body = await jsonBody<{ data: Array<{ email: string }> }>(membersRes);

    expect(body.data.map((entry) => entry.email)).toContain(oauthUsers.owner.email);
    expect(body.data.map((entry) => entry.email)).toContain(oauthUsers.member.email);
  });

  it('마지막 ADMIN의 role 변경/제거는 차단된다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-last-admin-owner');

    const owner = await testPrisma.user.findUnique({
      where: { email: oauthUsers.owner.email },
      select: {
        id: true,
        workspaceMembers: {
          orderBy: { joinedAt: 'asc' },
          select: { workspaceId: true },
        },
      },
    });

    const workspaceId = owner!.workspaceMembers[0].workspaceId;

    const demoteRes = await app.request(`/workspaces/${workspaceId}/members/${owner!.id}`, {
      method: 'PATCH',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({ role: 'MEMBER' }),
    });

    expect(demoteRes.status).toBe(409);
    const demoteBody = await jsonBody<{ errorCode: string }>(demoteRes);
    expect(demoteBody.errorCode).toBe('WORKSPACE_LAST_ADMIN_REQUIRED');

    const removeRes = await app.request(`/workspaces/${workspaceId}/members/${owner!.id}`, {
      method: 'DELETE',
      headers: { Cookie: authCookie(ownerSessionId) },
    });

    expect(removeRes.status).toBe(409);
    const removeBody = await jsonBody<{ errorCode: string }>(removeRes);
    expect(removeBody.errorCode).toBe('WORKSPACE_LAST_ADMIN_REQUIRED');
  });

  it('초대 생성/중복 초대 방지/수락이 동작한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-invite-owner');

    const workspace = await createWorkspaceByApi(app, ownerSessionId, 'Invite Workspace');

    const inviteRes = await app.request(`/workspaces/${workspace.id}/invite`, {
      method: 'POST',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({
        email: oauthUsers.member.email,
        role: 'MEMBER',
      }),
    });

    expect(inviteRes.status).toBe(201);
    const inviteBody = await jsonBody<{ inviteId: number; status: string }>(inviteRes);
    expect(inviteBody.status).toBe('PENDING');

    const duplicateRes = await app.request(`/workspaces/${workspace.id}/invite`, {
      method: 'POST',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({
        email: oauthUsers.member.email,
        role: 'MEMBER',
      }),
    });

    expect(duplicateRes.status).toBe(409);
    const duplicateBody = await jsonBody<{ errorCode: string }>(duplicateRes);
    expect(duplicateBody.errorCode).toBe('WORKSPACE_INVITE_ALREADY_PENDING');

    const invite = await testPrisma.workspaceInvite.findUnique({
      where: { id: inviteBody.inviteId },
      select: { token: true },
    });

    const memberSessionId = await loginWithUser(app, oauthUsers.member, 'ws-invite-member');

    const acceptRes = await app.request(`/invites/${invite!.token}/accept`, {
      method: 'POST',
      headers: { Cookie: authCookie(memberSessionId) },
    });

    expect(acceptRes.status).toBe(200);
    const acceptBody = await jsonBody<{ workspaceId: number; role: string }>(acceptRes);
    expect(acceptBody.workspaceId).toBe(workspace.id);
    expect(acceptBody.role).toBe('MEMBER');

    const member = await testPrisma.user.findUnique({
      where: { email: oauthUsers.member.email },
      select: { id: true },
    });
    const memberRecord = await testPrisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: member!.id,
        },
      },
      select: { role: true },
    });

    expect(memberRecord?.role).toBe('MEMBER');

    const acceptedInvite = await testPrisma.workspaceInvite.findUnique({
      where: { id: inviteBody.inviteId },
      select: { status: true },
    });
    expect(acceptedInvite?.status).toBe('ACCEPTED');
  });

  it('초대 수락 시 이메일 불일치와 만료를 검증한다', async () => {
    const app = makeApp();
    const ownerSessionId = await loginWithUser(app, oauthUsers.owner, 'ws-accept-owner');

    const workspace = await createWorkspaceByApi(app, ownerSessionId, 'Accept Guard Workspace');

    const mismatchInviteRes = await app.request(`/workspaces/${workspace.id}/invite`, {
      method: 'POST',
      headers: jsonHeaders(ownerSessionId),
      body: JSON.stringify({
        email: oauthUsers.outsider.email,
        role: 'MEMBER',
      }),
    });
    const mismatchInvite = await jsonBody<{ inviteId: number }>(mismatchInviteRes);

    const mismatchToken = await testPrisma.workspaceInvite.findUnique({
      where: { id: mismatchInvite.inviteId },
      select: { token: true },
    });

    const memberSessionId = await loginWithUser(app, oauthUsers.member, 'ws-accept-member');

    const mismatchAcceptRes = await app.request(`/invites/${mismatchToken!.token}/accept`, {
      method: 'POST',
      headers: { Cookie: authCookie(memberSessionId) },
    });

    expect(mismatchAcceptRes.status).toBe(403);
    const mismatchBody = await jsonBody<{ errorCode: string }>(mismatchAcceptRes);
    expect(mismatchBody.errorCode).toBe('WORKSPACE_INVITE_EMAIL_MISMATCH');

    const expiredInvite = await testPrisma.workspaceInvite.create({
      data: {
        workspaceId: workspace.id,
        email: oauthUsers.member.email,
        role: 'MEMBER',
        token: 'expired-invite-token',
        status: 'PENDING',
        expiresAt: new Date(Date.now() - 60_000),
      },
    });

    const expiredAcceptRes = await app.request(`/invites/${expiredInvite.token}/accept`, {
      method: 'POST',
      headers: { Cookie: authCookie(memberSessionId) },
    });

    expect(expiredAcceptRes.status).toBe(409);
    const expiredBody = await jsonBody<{ errorCode: string }>(expiredAcceptRes);
    expect(expiredBody.errorCode).toBe('WORKSPACE_INVITE_EXPIRED');

    const expiredInviteAfter = await testPrisma.workspaceInvite.findUnique({
      where: { id: expiredInvite.id },
      select: { status: true },
    });
    expect(expiredInviteAfter?.status).toBe('EXPIRED');
  });
});
