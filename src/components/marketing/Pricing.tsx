import Link from "next/link";
import { Check } from "lucide-react";
import { plans } from "@/lib/mock-data/plans";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function Pricing() {
  return (
    <section id="planos" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
      <div className="max-w-xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Planos para cada fase do seu negócio</h2>
        <p className="mt-3 text-slate-600">
          Todos os planos incluem 7 dias de teste grátis, sem necessidade de cartão de crédito.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan, index) => {
          const highlighted = index === 1;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-6 shadow-sm ${
                highlighted ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white"
              }`}
            >
              {highlighted && (
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  Mais popular
                </span>
              )}
              <h3 className={`mt-3 text-lg font-semibold ${highlighted ? "text-white" : "text-slate-900"}`}>
                {plan.name}
              </h3>
              <p className="mt-2 text-3xl font-semibold">
                {formatCurrency(plan.priceMonthly)}
                <span className={`text-sm font-normal ${highlighted ? "text-indigo-100" : "text-slate-500"}`}>
                  /mês
                </span>
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check size={16} className={`mt-0.5 shrink-0 ${highlighted ? "text-white" : "text-emerald-600"}`} />
                    <span className={highlighted ? "text-indigo-50" : "text-slate-600"}>{feature}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="mt-6 block">
                <Button
                  className="w-full"
                  variant={highlighted ? "secondary" : "outline"}
                >
                  Testar grátis por 7 dias
                </Button>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
