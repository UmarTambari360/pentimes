import { getCurrentUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/admin/profile-form";
import { User } from "lucide-react";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center gap-2">
        <User className="h-5 w-5 text-amber-500" />
        <h1 className="font-serif text-headline-xl font-bold">
          Profile Settings
        </h1>
      </div>
      <ProfileForm user={user} />
    </div>
  );
}
