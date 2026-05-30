"use client";

import { useState } from "react";
import { GraphQLClient } from "graphql-request";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AuthorAvatar } from "@/components/ui/author-avatar";
import { UPDATE_USER_ROLE } from "@/lib/graphql/queries/users";
import { formatDate } from "@/lib/utils";
import { Search, Shield, BookOpen, User } from "lucide-react";
import type { UserType } from "@/types";

const API_URL = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:4000";

const roleVariants: Record<string, "default" | "amber" | "success"> = {
  reader: "default",
  author: "amber",
  admin: "success",
};

const roleIcons = {
  reader: User,
  author: BookOpen,
  admin: Shield,
};

interface AdminUsersTableProps {
  users: UserType[];
}

export function AdminUsersTable({ users: initialUsers }: AdminUsersTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [confirmRole, setConfirmRole] = useState<{
    userId: string;
    newRole: string;
    userName: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const getAuthClient = () => {
    const token = document.cookie
      .split("; ")
      .find((r) => r.startsWith("access_token="))
      ?.split("=")[1];
    return new GraphQLClient(`${API_URL}/graphql`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setConfirmRole({ userId, newRole: role, userName: user.name });
  };

  const confirmRoleChange = async () => {
    if (!confirmRole) return;
    setSaving(true);
    try {
      const client = getAuthClient();
      await client.request(UPDATE_USER_ROLE, {
        input: { userId: confirmRole.userId, role: confirmRole.newRole },
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmRole.userId
            ? { ...u, role: confirmRole.newRole as UserType["role"] }
            : u,
        ),
      );
      toast.success(
        `${confirmRole.userName}'s role updated to ${confirmRole.newRole}`,
      );
      setConfirmRole(null);
    } catch {
      toast.error("Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

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
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-body-sm text-muted-foreground"
                >
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => {
                const RoleIcon = roleIcons[user.role] ?? User;
                return (
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
                      <div className="flex items-center gap-2">
                        <Select
                          defaultValue={user.role}
                          onValueChange={(val) =>
                            handleRoleChange(user.id, val)
                          }
                        >
                          <SelectTrigger className="h-7 w-28 text-caption">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reader">
                              <span className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                Reader
                              </span>
                            </SelectItem>
                            <SelectItem value="author">
                              <span className="flex items-center gap-2">
                                <BookOpen className="h-3 w-3" />
                                Author
                              </span>
                            </SelectItem>
                            <SelectItem value="admin">
                              <span className="flex items-center gap-2">
                                <Shield className="h-3 w-3" />
                                Admin
                              </span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Badge variant={roleVariants[user.role] ?? "default"}>
                          <RoleIcon className="h-3 w-3 mr-1" />
                          {user.role}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-caption text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Confirm role change dialog */}
      <Dialog
        open={Boolean(confirmRole)}
        onOpenChange={() => setConfirmRole(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change{" "}
              <span className="font-semibold">{confirmRole?.userName}</span>'s
              role to{" "}
              <span className="font-semibold capitalize">
                {confirmRole?.newRole}
              </span>
              ? This affects what they can access on the platform.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRole(null)}>
              Cancel
            </Button>
            <Button
              variant="amber"
              onClick={confirmRoleChange}
              disabled={saving}
            >
              {saving ? "Saving..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
