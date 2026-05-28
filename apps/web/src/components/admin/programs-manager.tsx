"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GraphQLClient } from "graphql-request";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";
import {
  CREATE_PROGRAM,
  DELETE_PROGRAM,
  UPDATE_PROGRAM,
} from "@/lib/graphql/queries/programs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import type { ScheduledProgramType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const ProgramSchema = z.object({
  title: z.string().min(3).max(200).trim(),
  description: z.string().max(1000).optional(),
  scheduledAt: z.string().min(1, "Date is required"),
  durationMinutes: z.coerce.number().int().min(1).max(1440).optional(),
});

interface ProgramsManagerProps {
  programs: ScheduledProgramType[];
}

export function ProgramsManager({
  programs: initialPrograms,
}: ProgramsManagerProps) {
  const [programs, setPrograms] = useState(initialPrograms);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof ProgramSchema>>({
    resolver: zodResolver(ProgramSchema),
  });

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleCreate = async (data: z.infer<typeof ProgramSchema>) => {
    setSaving(true);
    try {
      const client = getAuthClient();
      const result = await client.request<{
        createScheduledProgram: ScheduledProgramType;
      }>(CREATE_PROGRAM, {
        input: {
          ...data,
          scheduledAt: new Date(data.scheduledAt).toISOString(),
          durationMinutes: data.durationMinutes ?? null,
        },
      });
      setPrograms((prev) => [result.createScheduledProgram, ...prev]);
      toast.success("Program created!");
      reset();
    } catch {
      toast.error("Failed to create program");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const client = getAuthClient();
      await client.request(UPDATE_PROGRAM, { id, input: { status } });
      setPrograms((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, status: status as ScheduledProgramType["status"] }
            : p,
        ),
      );
      toast.success("Status updated!");
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this program?")) return;
    try {
      const client = getAuthClient();
      await client.request(DELETE_PROGRAM, { id });
      setPrograms((prev) => prev.filter((p) => p.id !== id));
      toast.success("Program deleted");
    } catch {
      toast.error("Failed to delete program");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <form
        onSubmit={handleSubmit(handleCreate)}
        className="p-5 rounded-lg border border-border bg-card shadow-card space-y-4"
      >
        <h2 className="font-serif font-semibold text-body flex items-center gap-2">
          <Plus className="h-4 w-4 text-amber-500" />
          Schedule New Program
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label>Title *</Label>
            <Input
              placeholder="Program title"
              {...register("title")}
              className={errors.title ? "border-destructive" : ""}
            />
            {errors.title && (
              <p className="text-caption text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Date & Time *</Label>
            <Input
              type="datetime-local"
              {...register("scheduledAt")}
              className={errors.scheduledAt ? "border-destructive" : ""}
            />
            {errors.scheduledAt && (
              <p className="text-caption text-destructive">
                {errors.scheduledAt.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              placeholder="60"
              min={1}
              max={1440}
              {...register("durationMinutes")}
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label>Description</Label>
            <Textarea
              placeholder="Program description"
              rows={2}
              {...register("description")}
            />
          </div>
        </div>

        <Button
          type="submit"
          variant="amber"
          size="sm"
          disabled={saving}
          className="gap-2"
        >
          <Calendar className="h-4 w-4" />
          {saving ? "Scheduling…" : "Schedule Program"}
        </Button>
      </form>

      {/* Programs list */}
      <div className="space-y-3">
        {programs.length === 0 ? (
          <div className="text-center py-12 border rounded-lg border-dashed border-border">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-body-sm text-muted-foreground">
              No programs scheduled yet.
            </p>
          </div>
        ) : (
          programs.map((program) => (
            <div
              key={program.id}
              className="flex items-start gap-4 p-4 rounded-lg border border-border bg-card shadow-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-body-sm font-semibold truncate">
                    {program.title}
                  </h3>
                  <Badge
                    variant={
                      program.status === "upcoming"
                        ? "upcoming"
                        : program.status === "completed"
                          ? "completed"
                          : "cancelled"
                    }
                  >
                    {program.status}
                  </Badge>
                </div>
                <p className="text-caption text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 shrink-0" />
                  {formatDate(program.scheduledAt)}
                  {program.durationMinutes &&
                    ` · ${program.durationMinutes} min`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Select
                  defaultValue={program.status}
                  onValueChange={(val) => handleStatusChange(program.id, val)}
                >
                  <SelectTrigger className="h-7 w-32 text-caption">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  onClick={() => handleDelete(program.id)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
