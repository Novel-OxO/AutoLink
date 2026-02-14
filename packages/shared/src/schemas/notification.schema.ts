import { z } from 'zod';

import { NotificationTypeSchema, PaginationQuerySchema } from './common.schema';

export const NotificationQuerySchema = PaginationQuerySchema.extend({
  unreadOnly: z.coerce.boolean().optional(),
});
export type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

export const NotificationResponseSchema = z.object({
  id: z.number(),
  type: NotificationTypeSchema,
  message: z.string(),
  data: z.record(z.unknown()).nullable(),
  read: z.boolean(),
  createdAt: z.string().datetime(),
});
export type NotificationResponse = z.infer<typeof NotificationResponseSchema>;
