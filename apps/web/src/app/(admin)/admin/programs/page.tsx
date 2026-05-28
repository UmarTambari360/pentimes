import { getServerClient } from "@/lib/graphql/client";
import { GET_SCHEDULED_PROGRAMS } from "@/lib/graphql/queries/programs";
import { ProgramsManager } from "@/components/admin/programs-manager";
import type { ScheduledProgramType } from "@/types";

interface ProgramsResult {
  scheduledPrograms: ScheduledProgramType[];
}

export default async function AdminProgramsPage() {
  let programs: ScheduledProgramType[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<ProgramsResult>(
      GET_SCHEDULED_PROGRAMS,
      {},
    );
    programs = data.scheduledPrograms;
  } catch {}

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">
          Scheduled Programs
        </h1>
        <p className="text-caption text-muted-foreground mt-1">
          Manage upcoming programs and events
        </p>
      </div>
      <ProgramsManager programs={programs} />
    </div>
  );
}
