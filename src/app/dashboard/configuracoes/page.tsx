"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { updateCompanyPlan, updateCompanyStatus } from "@/lib/data/companies";
import { plans } from "@/lib/mock-data/plans";
import { getEffectiveStatus, daysRemaining, STATUS_LABELS } from "@/lib/trial";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export default function ConfiguracoesPage() {
  const { company, refreshCompany } = useAuth();
  const [processingPlanId, setProcessingPlanId] = useState<string | null>(null);

  if (!company) return null;

  const status = getEffectiveStatus(company);
  const isTrialing = status === "trialing";
  const isBlocked = status === "expired" || status === "canceled";

  async function handleSelectPlan(planId: string) {
    if (!company) return;
    setProcessingPlanId(planId);
    await updateCompanyPlan(company.id, planId);
    await updateCompanyStatus(company.id, "active");
    await refreshCompany();
    setProcessingPlanId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Configurações</h1>
        <p className="text-sm text-slate-500">Dados da empresa, plano e assinatura.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da empresa</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Razão social" value={company.name} />
          <Field label="CNPJ" value={company.cnpj} />
          <Field label="Segmento" value={company.segment} />
          <Field label="Cliente desde" value={formatDate(company.createdAt)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Badge tone={isBlocked ? "red" : isTrialing ? "yellow" : "green"}>{STATUS_LABELS[status]}</Badge>
            {isTrialing && (
              <span className="text-sm text-slate-500">
                Faltam {daysRemaining(company)} {daysRemaining(company) === 1 ? "dia" : "dias"} de teste grátis.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-base font-semibold text-slate-900">
          {isBlocked ? "Escolha um plano para continuar" : "Planos disponíveis"}
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === company.planId && status === "active";
            return (
              <Card key={plan.id} className={isCurrent ? "ring-2 ring-indigo-600" : undefined}>
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-2xl font-semibold text-slate-900">
                    {formatCurrency(plan.priceMonthly)}
                    <span className="text-sm font-normal text-slate-500">/mês</span>
                  </p>
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Badge tone="indigo">Plano atual</Badge>
                  ) : (
                    <Button
                      className="w-full"
                      variant="outline"
                      disabled={processingPlanId === plan.id}
                      onClick={() => handleSelectPlan(plan.id)}
                    >
                      {processingPlanId === plan.id ? "Processando..." : "Assinar este plano"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900">{value}</p>
    </div>
  );
}
