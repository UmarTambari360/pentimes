import { getCurrentUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/admin/profile-form";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center">
          <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="font-serif text-headline-xl font-bold">
            Profile Settings
          </h1>
          <p className="text-caption text-muted-foreground">
            Manage your personal information and account security.
          </p>
        </div>
      </div>

      <ProfileForm user={user} />
    </div>
  );
}
