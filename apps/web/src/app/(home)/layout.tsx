import { PropsWithChildren } from "react";
import AppSidebar from "@/components/layout/AppSidebar";
import BranchSelectorHeader from "@/components/layout/BranchSelectorHeader";
import { AuthGuard } from "@/components/auth/auth-guard";

export default function AppLayout({ children }: PropsWithChildren) {
  return (
    <AuthGuard>
      <div className="h-screen overflow-hidden bg-background">
        <AppSidebar />
        <main className="relative lg:ml-72 h-full min-h-0 flex flex-col transition-all duration-200">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,oklch(70.625%_0.18611_48.076_/0.08),transparent_45%),radial-gradient(circle_at_bottom_left,oklch(69.943%_0.13388_165.493_/0.08),transparent_45%)]" />
          <BranchSelectorHeader />
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
