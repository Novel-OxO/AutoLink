import { z } from 'zod';

import { OAuthProviderSchema } from './common.schema';

export const OAuthCallbackQuerySchema = z.object({
  code: z.string(),
  state: z.string().optional(),
});
export type OAuthCallbackQuery = z.infer<typeof OAuthCallbackQuerySchema>;

export const UserResponseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  nickname: z.string(),
  profileImage: z.string().nullable(),
  profilePublic: z.boolean(),
  oauths: z.array(
    z.object({
      provider: OAuthProviderSchema,
      connectedAt: z.string().datetime(),
    }),
  ),
  createdAt: z.string().datetime(),
});
export type UserResponse = z.infer<typeof UserResponseSchema>;
