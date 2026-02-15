import {
  CreateInviteSchema,
  CreateWorkspaceSchema,
  UpdateMemberRoleSchema,
  UpdateWorkspaceSchema,
} from '@autolink/shared/schemas';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { z } from 'zod';

import { requireAuth } from '@/shared/middleware/auth';
import type { AppEnv } from '@/shared/types/context';

import {
  acceptWorkspaceInvite,
  createWorkspace,
  createWorkspaceInvite,
  deleteWorkspace,
  listWorkspaceMembers,
  listWorkspaces,
  removeWorkspaceMember,
  updateWorkspace,
  updateWorkspaceMemberRole,
} from './workspace.service';

const WorkspaceIdParamSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
});

const WorkspaceMemberParamSchema = WorkspaceIdParamSchema.extend({
  userId: z.coerce.number().int().positive(),
});

const InviteTokenParamSchema = z.object({
  inviteToken: z.string().min(1),
});

export const workspaceRoutes = new Hono<AppEnv>();

workspaceRoutes.post(
  '/workspaces',
  requireAuth,
  zValidator('json', CreateWorkspaceSchema),
  async (c) => {
    const workspace = await createWorkspace(c.get('user').id, c.req.valid('json'));
    return c.json(workspace, 201);
  },
);

workspaceRoutes.get('/workspaces', requireAuth, async (c) => {
  const result = await listWorkspaces(c.get('user').id);
  return c.json(result);
});

workspaceRoutes.patch(
  '/workspaces/:workspaceId',
  requireAuth,
  zValidator('param', WorkspaceIdParamSchema),
  zValidator('json', UpdateWorkspaceSchema),
  async (c) => {
    const { workspaceId } = c.req.valid('param');
    const workspace = await updateWorkspace(c.get('user').id, workspaceId, c.req.valid('json'));

    return c.json(workspace);
  },
);

workspaceRoutes.delete(
  '/workspaces/:workspaceId',
  requireAuth,
  zValidator('param', WorkspaceIdParamSchema),
  async (c) => {
    const { workspaceId } = c.req.valid('param');
    await deleteWorkspace(c.get('user').id, workspaceId);

    return c.json({ message: '워크스페이스가 삭제되었습니다' });
  },
);

workspaceRoutes.post(
  '/workspaces/:workspaceId/invite',
  requireAuth,
  zValidator('param', WorkspaceIdParamSchema),
  zValidator('json', CreateInviteSchema),
  async (c) => {
    const { workspaceId } = c.req.valid('param');
    const invite = await createWorkspaceInvite(c.get('user').id, workspaceId, c.req.valid('json'));

    return c.json(invite, 201);
  },
);

workspaceRoutes.get(
  '/workspaces/:workspaceId/members',
  requireAuth,
  zValidator('param', WorkspaceIdParamSchema),
  async (c) => {
    const { workspaceId } = c.req.valid('param');
    const members = await listWorkspaceMembers(c.get('user').id, workspaceId);

    return c.json(members);
  },
);

workspaceRoutes.patch(
  '/workspaces/:workspaceId/members/:userId',
  requireAuth,
  zValidator('param', WorkspaceMemberParamSchema),
  zValidator('json', UpdateMemberRoleSchema),
  async (c) => {
    const { workspaceId, userId } = c.req.valid('param');
    const member = await updateWorkspaceMemberRole(
      c.get('user').id,
      workspaceId,
      userId,
      c.req.valid('json'),
    );

    return c.json(member);
  },
);

workspaceRoutes.delete(
  '/workspaces/:workspaceId/members/:userId',
  requireAuth,
  zValidator('param', WorkspaceMemberParamSchema),
  async (c) => {
    const { workspaceId, userId } = c.req.valid('param');
    await removeWorkspaceMember(c.get('user').id, workspaceId, userId);

    return c.json({ message: '멤버가 제거되었습니다' });
  },
);

workspaceRoutes.post(
  '/invites/:inviteToken/accept',
  requireAuth,
  zValidator('param', InviteTokenParamSchema),
  async (c) => {
    const { inviteToken } = c.req.valid('param');
    const acceptedInvite = await acceptWorkspaceInvite(
      c.get('user').id,
      c.get('user').email,
      inviteToken,
    );

    return c.json(acceptedInvite);
  },
);
