"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { FullScreenLoading } from "@/components/ui/FullScreenLoading";

export function RequireCompanyUser({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role === "super_admin")) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user || user.role === "super_admin") {
    return <FullScreenLoading />;
  }

  return <>{children}</>;
}
