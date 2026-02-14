import { z } from 'zod';

// Enums
export const LocaleSchema = z.enum(['KO', 'EN']);
export type Locale = z.infer<typeof LocaleSchema>;

export const VisibilitySchema = z.enum(['PRIVATE', 'PUBLIC']);
export type Visibility = z.infer<typeof VisibilitySchema>;

export const CrawlStatusSchema = z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']);
export type CrawlStatus = z.infer<typeof CrawlStatusSchema>;

export const OAuthProviderSchema = z.enum(['GOOGLE', 'APPLE']);
export type OAuthProvider = z.infer<typeof OAuthProviderSchema>;

export const MessageRoleSchema = z.enum(['USER', 'ASSISTANT']);
export type MessageRole = z.infer<typeof MessageRoleSchema>;

export const FeedbackSchema = z.enum(['UP', 'DOWN']);
export type Feedback = z.infer<typeof FeedbackSchema>;

// Pagination
export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    data: z.array(itemSchema),
    nextCursor: z.string().nullable(),
    hasNext: z.boolean(),
  });
