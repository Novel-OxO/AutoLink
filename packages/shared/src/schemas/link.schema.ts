import { z } from 'zod';

import { CrawlStatusSchema, VisibilitySchema } from './common.schema';

export const CreateLinkSchema = z.object({
  url: z.string().url(),
  folderId: z.number().int().positive().optional(),
  memo: z.string().max(1000).optional(),
});
export type CreateLink = z.infer<typeof CreateLinkSchema>;

export const UpdateLinkSchema = z.object({
  folderId: z.number().int().positive().nullable().optional(),
  memo: z.string().max(1000).nullable().optional(),
  visibility: VisibilitySchema.optional(),
});
export type UpdateLink = z.infer<typeof UpdateLinkSchema>;

export const LinkResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  ogTitle: z.string().nullable(),
  ogDescription: z.string().nullable(),
  ogImage: z.string().nullable(),
  summary: z.string().nullable(),
  tags: z.array(z.string()),
  crawlStatus: CrawlStatusSchema,
  folderId: z.number().nullable(),
  memo: z.string().nullable(),
  visibility: VisibilitySchema,
  readAt: z.string().datetime().nullable(),
  contentUpdated: z.boolean(),
  createdAt: z.string().datetime(),
});
export type LinkResponse = z.infer<typeof LinkResponseSchema>;
