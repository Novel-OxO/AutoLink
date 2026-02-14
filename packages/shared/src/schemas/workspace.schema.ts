import { z } from 'zod';

import { InviteStatusSchema, WorkspaceRoleSchema } from './common.schema';

// Workspace CRUD
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
export type CreateWorkspace = z.infer<typeof CreateWorkspaceSchema>;

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
});
export type UpdateWorkspace = z.infer<typeof UpdateWorkspaceSchema>;

export const WorkspaceResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  role: WorkspaceRoleSchema,
  memberCount: z.number(),
  createdAt: z.string().datetime(),
});
export type WorkspaceResponse = z.infer<typeof WorkspaceResponseSchema>;

// Members
export const WorkspaceMemberResponseSchema = z.object({
  userId: z.number(),
  nickname: z.string(),
  email: z.string(),
  role: WorkspaceRoleSchema,
  joinedAt: z.string().datetime(),
});
export type WorkspaceMemberResponse = z.infer<typeof WorkspaceMemberResponseSchema>;

export const UpdateMemberRoleSchema = z.object({
  role: WorkspaceRoleSchema,
});
export type UpdateMemberRole = z.infer<typeof UpdateMemberRoleSchema>;

// Invites
export const CreateInviteSchema = z.object({
  email: z.string().email(),
  role: WorkspaceRoleSchema.optional(),
});
export type CreateInvite = z.infer<typeof CreateInviteSchema>;

export const InviteResponseSchema = z.object({
  inviteId: z.number(),
  email: z.string(),
  role: WorkspaceRoleSchema,
  status: InviteStatusSchema,
  expiresAt: z.string().datetime(),
});
export type InviteResponse = z.infer<typeof InviteResponseSchema>;

export const AcceptInviteResponseSchema = z.object({
  workspaceId: z.number(),
  workspaceName: z.string(),
  role: WorkspaceRoleSchema,
});
export type AcceptInviteResponse = z.infer<typeof AcceptInviteResponseSchema>;
