import type { Metadata } from "next";
import { Calendar, Clock, CheckCircle, XCircle } from "lucide-react";
import { cachedClient } from "@/lib/graphql/client";
import { GET_SCHEDULED_PROGRAMS } from "@/lib/graphql/queries/programs";
import { formatDate, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import type { ScheduledProgramType } from "@/types";

export const metadata: Metadata = {
  title: "Scheduled Programs",
  description: "View all upcoming and past programs from Pen Times Magazine",
};

interface ProgramsResult {
  scheduledPrograms: ScheduledProgramType[];
}

const statusIcon = {
  upcoming: <Calendar className="h-4 w-4 text-blue-500" />,
  completed: <CheckCircle className="h-4 w-4 text-green-500" />,
  cancelled: <XCircle className="h-4 w-4 text-red-500" />,
};

export default async function ProgramsPage() {
  const client = cachedClient(600);

  let programs: ScheduledProgramType[] = [];
  try {
    const data = await client.request<ProgramsResult>(
      GET_SCHEDULED_PROGRAMS,
      {},
    );
    programs = data.scheduledPrograms;
  } catch {}

  const upcoming = programs.filter((p) => p.status === "upcoming");
  const past = programs.filter((p) => p.status !== "upcoming");

  return (
    <div className="max-w-container mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 pb-4 border-b-2 border-foreground">
        <p className="text-overline font-semibold uppercase tracking-widest text-amber-600 mb-2">
          Pen Times
        </p>
        <h1 className="font-serif text-display font-bold">
          Scheduled Programs
        </h1>
        <p className="text-body text-muted-foreground mt-2 max-w-prose">
          Stay updated with our upcoming shows, events, and community programs.
        </p>
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-12">
          <div className="border-t-2 border-foreground mb-6 pt-4">
            <h2 className="font-serif text-headline-lg font-bold">
              Upcoming Programs
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.map((program) => (
              <div
                key={program.id}
                className="rounded-lg border border-border bg-card p-5 shadow-card hover:shadow-editorial transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  {statusIcon[program.status]}
                  <Badge variant="upcoming">Upcoming</Badge>
                </div>
                <h3 className="font-serif font-bold text-body mb-2 leading-snug">
                  {program.title}
                </h3>
                {program.description && (
                  <p className="text-caption text-muted-foreground mb-4 line-clamp-2">
                    {program.description}
                  </p>
                )}
                <div className="flex flex-col gap-1.5 text-caption text-muted-foreground border-t border-border pt-3 mt-auto">
                  <span className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                    {formatDate(program.scheduledAt)}
                  </span>
                  {program.durationMinutes && (
                    <span className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                      {program.durationMinutes} minutes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <div className="border-t-2 border-foreground mb-6 pt-4">
            <h2 className="font-serif text-headline-lg font-bold text-muted-foreground">
              Past Programs
            </h2>
          </div>
          <div className="space-y-3">
            {past.map((program) => (
              <div
                key={program.id}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/20",
                  program.status === "cancelled" && "opacity-60",
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {statusIcon[program.status]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-serif font-semibold text-body-sm">
                      {program.title}
                    </h3>
                    <Badge
                      variant={
                        program.status === "completed"
                          ? "completed"
                          : "cancelled"
                      }
                    >
                      {program.status}
                    </Badge>
                  </div>
                  {program.description && (
                    <p className="text-caption text-muted-foreground">
                      {program.description}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right text-caption text-muted-foreground">
                  <p>{formatDate(program.scheduledAt)}</p>
                  {program.durationMinutes && <p>{program.durationMinutes}m</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {programs.length === 0 && (
        <div className="text-center py-16">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-body text-muted-foreground">
            No programs scheduled yet.
          </p>
        </div>
      )}
    </div>
  );
}
