import { z } from 'zod';

export const TrashItemResponseSchema = z.object({
  id: z.number(),
  url: z.string(),
  ogTitle: z.string().nullable(),
  ogImage: z.string().nullable(),
  deletedAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});
export type TrashItemResponse = z.infer<typeof TrashItemResponseSchema>;

export const RestoreResponseSchema = z.object({
  message: z.string(),
  link: z.object({
    id: z.number(),
    folderId: z.number().nullable(),
  }),
});
export type RestoreResponse = z.infer<typeof RestoreResponseSchema>;
