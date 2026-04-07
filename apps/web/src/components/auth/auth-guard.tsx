"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/use-session";
import type { ReactNode } from "react";

export function AuthGuard({ children }: { children: ReactNode }) {
  const { session, loading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (loading === false && session === null) {
      router.replace("/login");
    }
  }, [loading, session, router]);

  if (loading || session === null) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  return <>{children}</>;
}
