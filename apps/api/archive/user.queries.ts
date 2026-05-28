// import { eq }    from 'drizzle-orm';
// import { db }    from '../config/db.js';
// import { users } from '../db/schema/index.js';
// import type { UserInsert, UserSelect } from '../db/schema/index.js';
// import type { PublicUser, PrivateUser } from '../types/user.type.js';

// function toPublicUser(user: UserSelect): PublicUser {
//   const { password: _, ...publicUser } = user;
//   return publicUser;
// }

// export async function findUserByEmail(email: string): Promise<PrivateUser | null> {
//   const result = await db
//     .select()
//     .from(users)
//     .where(eq(users.email, email))
//     .limit(1);
//   return result[0] ?? null;
// }

// export async function findUserById(id: string): Promise<PublicUser | null> {
//   const result = await db
//     .select()
//     .from(users)
//     .where(eq(users.id, id))
//     .limit(1);
//   if (!result[0]) return null;
//   return toPublicUser(result[0]);
// }

// export async function findPrivateUserById(id: string): Promise<PrivateUser | null> {
//   const result = await db
//     .select()
//     .from(users)
//     .where(eq(users.id, id))
//     .limit(1);
//   return result[0] ?? null;
// }

// export async function createUser(input: UserInsert): Promise<PublicUser> {
//   const result = await db.insert(users).values(input).returning();
//   if (!result[0]) throw new Error('Failed to create user');
//   return toPublicUser(result[0]);
// }

// export async function updateUser(
//   id: string,
//   input: Partial<Omit<UserInsert, 'id' | 'email' | 'createdAt'>>
// ): Promise<PublicUser> {
//   const result = await db
//     .update(users)
//     .set({ ...input, updatedAt: new Date() })
//     .where(eq(users.id, id))
//     .returning();
//   if (!result[0]) throw new Error('User not found');
//   return toPublicUser(result[0]);
// }

// export async function emailExists(email: string): Promise<boolean> {
//   const result = await db
//     .select({ id: users.id })
//     .from(users)
//     .where(eq(users.email, email))
//     .limit(1);
//   return result.length > 0;
// }