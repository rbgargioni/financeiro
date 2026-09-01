"use client";

import { RequireCompanyUser } from "@/components/auth/RequireCompanyUser";
import { DashboardShell } from "@/components/layout/DashboardShell";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireCompanyUser>
      <DashboardShell>{children}</DashboardShell>
    </RequireCompanyUser>
  );
}
