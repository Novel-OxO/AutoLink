import { z } from 'zod';

export const TagResponseSchema = z.object({
  id: z.number(),
  name: z.string(),
  createdAt: z.string().datetime(),
});
export type TagResponse = z.infer<typeof TagResponseSchema>;
