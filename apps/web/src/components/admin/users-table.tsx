"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { UPDATE_USER_ROLE } from "@/lib/graphql/queries/users";
import { formatDate } from "@/lib/utils";
import type { UserType } from "@/types";
import { getAuthClient } from "@/lib/graphql/browser-client";

const roleVariants: Record<string, "default" | "amber" | "success"> = {
  reader: "default",
  author: "amber",
  admin: "success",
};

interface UsersTableProps {
  users: UserType[];
}

export function UsersTable({ users: initialUsers }: UsersTableProps) {
  const [users, setUsers] = useState(initialUsers);

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const client = getAuthClient();
      await client.request(UPDATE_USER_ROLE, { input: { userId, role } });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role: role as UserType["role"] } : u,
        ),
      );
      toast.success("User role updated!");
    } catch {
      toast.error("Failed to update role");
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="hidden md:table-cell">Joined</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <AuthorAvatar author={user} size="sm" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium truncate">
                      {user.name}
                    </p>
                    <p className="text-caption text-muted-foreground sm:hidden truncate">
                      {user.email}
                    </p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-body-sm text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell>
                <Select
                  defaultValue={user.role}
                  onValueChange={(val) => handleRoleChange(user.id, val)}
                >
                  <SelectTrigger className="h-7 w-28 text-caption">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reader">Reader</SelectItem>
                    <SelectItem value="author">Author</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="hidden md:table-cell text-caption text-muted-foreground">
                {formatDate(user.createdAt)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
