import { z } from 'zod';

export const BaseEvent = z.object({
  id: z.string(),
  type: z.string(),
  version: z.number().int().positive(),
  occurredAt: z.string(), // ISO
  traceId: z.string().optional(),
});

export const UserCreatedV1 = BaseEvent.extend({
  type: z.literal('user.created'),
  version: z.literal(1),
  data: z.object({
    userId: z.string(),
    email: z.string().email(),
  }),
});

export type UserCreatedV1Type = z.infer<typeof UserCreatedV1>;
