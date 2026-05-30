import { getServerClient } from "@/lib/graphql/client";
import { GET_USERS } from "@/lib/graphql/queries/users";
import { AdminUsersTable } from "@/components/admin/admin-users-table";
import type { UserType } from "@/types";

interface UsersResult {
  users: UserType[];
}

export default async function AdminUsersPage() {
  let users: UserType[] = [];

  try {
    const client = await getServerClient();
    const data = await client.request<UsersResult>(GET_USERS);
    users = data.users;
  } catch {}

  const roleBreakdown = {
    reader: users.filter((u) => u.role === "reader").length,
    author: users.filter((u) => u.role === "author").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">Users</h1>
        <p className="text-caption text-muted-foreground mt-1">
          {users.length} registered users ·{" "}
          <span className="text-amber-600">{roleBreakdown.author} authors</span>{" "}
          · <span className="text-green-600">{roleBreakdown.admin} admins</span>
        </p>
      </div>
      <AdminUsersTable users={users} />
    </div>
  );
}
