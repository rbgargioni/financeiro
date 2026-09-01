"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SubscriptionStatus } from "@/lib/types";

export function TrialExpiredScreen({ status }: { status: SubscriptionStatus }) {
  const isCanceled = status === "canceled";

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
          <Lock size={26} />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          {isCanceled ? "Assinatura cancelada" : "Seu teste grátis terminou"}
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          {isCanceled
            ? "A assinatura desta empresa foi cancelada. Escolha um plano para continuar usando o Fluxa."
            : "Os 7 dias de teste grátis chegaram ao fim. Escolha um plano para continuar acessando seus dados financeiros."}
        </p>
        <Link href="/dashboard/configuracoes">
          <Button className="mt-6">Ver planos e continuar</Button>
        </Link>
      </div>
    </div>
  );
}
