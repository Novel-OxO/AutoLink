import { z } from 'zod';

import { VisibilitySchema } from './common.schema';

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(100),
  parentId: z.number().int().positive().nullable().optional(),
});
export type CreateFolder = z.infer<typeof CreateFolderSchema>;

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  parentId: z.number().int().positive().nullable().optional(),
  isDocked: z.boolean().optional(),
  visibility: VisibilitySchema.optional(),
});
export type UpdateFolder = z.infer<typeof UpdateFolderSchema>;

export const FolderResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  parentId: z.number().nullable(),
  isDocked: z.boolean(),
  visibility: VisibilitySchema,
  linkCount: z.number(),
  createdAt: z.string().datetime(),
});
export type FolderResponse = z.infer<typeof FolderResponseSchema>;
