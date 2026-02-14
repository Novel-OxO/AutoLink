import { z } from 'zod';

export const SearchQuerySchema = z.object({
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
export type SearchQuery = z.infer<typeof SearchQuerySchema>;

export const SearchResultSchema = z.object({
  id: z.number(),
  url: z.string(),
  ogTitle: z.string().nullable(),
  ogImage: z.string().nullable(),
  summary: z.string().nullable(),
  tags: z.array(z.string()),
  highlight: z.string().nullable(),
  score: z.number(),
  folderId: z.number().nullable(),
});
export type SearchResult = z.infer<typeof SearchResultSchema>;
