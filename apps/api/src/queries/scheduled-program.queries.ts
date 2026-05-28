import { db }                   from '../config/db.js';
import { scheduledPrograms }    from '../db/schema/index.js';
import { eq, desc, and, gte }   from 'drizzle-orm';

export async function findAllPrograms(status?: 'upcoming' | 'completed' | 'cancelled') {
  return db.query.scheduledPrograms.findMany({
    where: status ? eq(scheduledPrograms.status, status) : undefined,
    orderBy: [desc(scheduledPrograms.scheduledAt)],
  });
}

export async function findProgramById(id: string) {
  const result = await db.query.scheduledPrograms.findFirst({
    where: eq(scheduledPrograms.id, id),
  });
  return result ?? null;
}

export async function findUpcomingPrograms(limit = 5) {
  return db.query.scheduledPrograms.findMany({
    where: and(
      eq(scheduledPrograms.status, 'upcoming'),
      gte(scheduledPrograms.scheduledAt, new Date())
    ),
    orderBy: (p, { asc }) => [asc(p.scheduledAt)],
    limit,
  });
}

export async function createProgram(data: {
  title: string;
  description?: string | null;
  scheduledAt: Date;
  durationMinutes?: number | null;
  status?: 'upcoming' | 'completed' | 'cancelled';
}) {
  const [program] = await db.insert(scheduledPrograms).values(data).returning();
  return program!;
}

export async function updateProgram(id: string, data: Partial<{
  title: string;
  description: string | null;
  scheduledAt: Date;
  durationMinutes: number | null;
  status: 'upcoming' | 'completed' | 'cancelled';
}>) {
  const [program] = await db
    .update(scheduledPrograms)
    .set(data)
    .where(eq(scheduledPrograms.id, id))
    .returning();
  return program ?? null;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const result = await db
    .delete(scheduledPrograms)
    .where(eq(scheduledPrograms.id, id))
    .returning({ id: scheduledPrograms.id });
  return result.length > 0;
}