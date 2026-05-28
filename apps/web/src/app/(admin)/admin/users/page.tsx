import { getServerClient } from "@/lib/graphql/client";
import { GET_USERS } from "@/lib/graphql/queries/users";
import { UsersTable } from "@/components/admin/users-table";
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

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="font-serif text-headline-xl font-bold">Users</h1>
        <p className="text-caption text-muted-foreground mt-1">
          {users.length} registered users
        </p>
      </div>
      <UsersTable users={users} />
    </div>
  );
}
