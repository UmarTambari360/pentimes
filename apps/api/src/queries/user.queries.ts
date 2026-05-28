import { db }              from '../config/db.js';
import { users }           from '../db/schema/index.js';
import { eq }              from 'drizzle-orm';
import type { UserRole }   from '@pentimes/shared';

export async function findUserById(id: string) {
  const result = await db.query.users.findFirst({
    where: eq(users.id, id),
  });
  if (!result) return null;
  const { password: _, ...user } = result;
  return user;
}

export async function findUserByEmail(email: string) {
  return db.query.users.findFirst({
    where: eq(users.email, email),
  });
}

export async function findAllUsers() {
  const result = await db.query.users.findMany({
    orderBy: (u, { desc }) => [desc(u.createdAt)],
  });
  return result.map(({ password: _, ...u }) => u);
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}) {
  const [user] = await db.insert(users).values(data).returning();
  return user!;
}

export async function updateUser(id: string, data: Partial<{
  name: string;
  bio: string | null;
  avatar: string | null;
  password: string;
  updatedAt: Date;
}>) {
  const [user] = await db
    .update(users)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!user) return null;
  const { password: _, ...result } = user;
  return result;
}

export async function updateUserRole(id: string, role: UserRole) {
  const [user] = await db
    .update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  if (!user) return null;
  const { password: _, ...result } = user;
  return result;
}