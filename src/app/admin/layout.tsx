"use client";

import { RequireSuperAdmin } from "@/components/auth/RequireSuperAdmin";
import { AdminShell } from "@/components/layout/AdminShell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireSuperAdmin>
      <AdminShell>{children}</AdminShell>
    </RequireSuperAdmin>
  );
}
