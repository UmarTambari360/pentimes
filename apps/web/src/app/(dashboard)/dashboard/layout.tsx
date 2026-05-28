import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 xl:w-64 border-r border-border flex-col fixed inset-y-0 left-0 z-30 bg-background">
        <DashboardSidebar className="h-full" />
      </aside>

      {/* Mobile sidebar */}
      <Sheet>
        <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
          <SheetTrigger asChild>
            <button
              className="p-2 rounded-md hover:bg-muted transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <span className="font-serif font-bold text-body">Dashboard</span>
        </div>
        <SheetContent side="left" className="p-0 w-64">
          <DashboardSidebar className="h-full" />
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="flex-1 lg:ml-60 xl:ml-64 min-h-screen">
        <div className="pt-14 lg:pt-0">{children}</div>
      </main>
    </div>
  );
}
