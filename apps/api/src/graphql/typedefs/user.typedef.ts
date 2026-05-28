import { builder } from '../builder.js';
import type { PublicUser } from '../../types/user.type.js';

// User Type
export const UserType = builder.objectRef<PublicUser>('User').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    email: t.exposeString('email'),
    avatar: t.exposeString('avatar', { nullable: true }),
    role: t.exposeString('role'),
    bio: t.exposeString('bio', { nullable: true }),

    createdAt: t.field({
      type: 'String',
      resolve: (user) => user.createdAt.toISOString(),
    }),

    updatedAt: t.field({
      type: 'String',
      resolve: (user) => user.updatedAt.toISOString(),
    }),
  }),
});

// Auth Payload
export const AuthPayloadType = builder.objectRef<{
  user: PublicUser;
  accessToken: string;
}>('AuthPayload').implement({
  fields: (t) => ({
    user: t.field({ type: UserType, resolve: (p) => p.user }),
    accessToken: t.exposeString('accessToken'),
  }),
});

// Author Summary (for lists)
export const AuthorSummaryType = builder.objectRef<{
  id: string;
  name: string;
  avatar?: string | null;
  bio?: string | null;
}>('AuthorSummary').implement({
  fields: (t) => ({
    id: t.exposeString('id'),
    name: t.exposeString('name'),
    avatar: t.exposeString('avatar', { nullable: true }),
    bio: t.exposeString('bio', { nullable: true }),
  }),
});