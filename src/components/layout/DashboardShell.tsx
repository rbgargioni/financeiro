"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getEffectiveStatus } from "@/lib/trial";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TrialBanner } from "./TrialBanner";
import { TrialExpiredScreen } from "./TrialExpiredScreen";
import { FullScreenLoading } from "@/components/ui/FullScreenLoading";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { company } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  if (!company) {
    return <FullScreenLoading />;
  }

  const status = getEffectiveStatus(company);
  const onConfiguracoes = pathname.replace(/\/$/, "") === "/dashboard/configuracoes";
  const isBlocked = (status === "expired" || status === "canceled") && !onConfiguracoes;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <TrialBanner company={company} status={status} />
        <main className="flex flex-1 flex-col p-4 md:p-8">
          {isBlocked ? <TrialExpiredScreen status={status} /> : children}
        </main>
      </div>
    </div>
  );
}
