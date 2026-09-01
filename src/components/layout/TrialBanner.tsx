"use client";

import Link from "next/link";
import { AlertTriangle, Clock } from "lucide-react";
import { Company, SubscriptionStatus } from "@/lib/types";
import { daysRemaining } from "@/lib/trial";

export function TrialBanner({ company, status }: { company: Company; status: SubscriptionStatus }) {
  if (status === "trialing") {
    const days = daysRemaining(company);
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 bg-indigo-600 px-4 py-2.5 text-sm text-white md:px-8">
        <div className="flex items-center gap-2">
          <Clock size={16} />
          <span>
            Faltam <strong>{days}</strong> {days === 1 ? "dia" : "dias"} do seu teste grátis.
          </span>
        </div>
        <Link href="/dashboard/configuracoes" className="font-semibold underline underline-offset-2">
          Fazer upgrade
        </Link>
      </div>
    );
  }

  if (status === "past_due") {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-500 px-4 py-2.5 text-sm text-white md:px-8">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} />
          <span>Identificamos um problema com o pagamento da sua assinatura.</span>
        </div>
        <Link href="/dashboard/configuracoes" className="font-semibold underline underline-offset-2">
          Regularizar
        </Link>
      </div>
    );
  }

  return null;
}
