import { z } from 'zod';

export const USER_CREATED_V1 = 'user.created.v1' as const;

export const UserCreatedV1Schema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
});

export type UserCreatedV1Payload = z.infer<typeof UserCreatedV1Schema>;
export type UserCreatedV1Event = {
  type: typeof USER_CREATED_V1;
  version: 1;
  payload: UserCreatedV1Payload;
};
