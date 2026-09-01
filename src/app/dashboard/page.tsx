"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Wallet, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listTransactions } from "@/lib/data/transactions";
import { listContacts } from "@/lib/data/contacts";
import { Transaction, Contact } from "@/lib/types";
import { computeSummary, buildWeeklyCashFlow } from "@/lib/reports";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CashFlowChart } from "@/components/charts/CashFlowChart";
import { STATUS_TONE, STATUS_LABEL } from "@/lib/status-labels";

export default function DashboardHomePage() {
  const { company } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    let active = true;
    setLoading(true);
    Promise.all([listTransactions(company.id), listContacts(company.id)]).then(([txs, cts]) => {
      if (!active) return;
      setTransactions(txs);
      setContacts(cts);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [company]);

  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const chartData = useMemo(() => buildWeeklyCashFlow(transactions), [transactions]);
  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";

  const upcoming = useMemo(
    () =>
      transactions
        .filter((t) => t.status !== "paid")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 6),
    [transactions]
  );

  if (loading) {
    return <p className="text-sm text-slate-500">Carregando seus dados financeiros...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Visão geral da saúde financeira da sua empresa.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={<Wallet size={18} />}
          label="Saldo atual"
          value={formatCurrency(summary.balance)}
          tone="indigo"
        />
        <SummaryCard
          icon={<ArrowDownCircle size={18} />}
          label="A receber"
          value={formatCurrency(summary.receivablePending)}
          tone="green"
        />
        <SummaryCard
          icon={<ArrowUpCircle size={18} />}
          label="A pagar"
          value={formatCurrency(summary.payablePending)}
          tone="red"
        />
        <SummaryCard
          icon={<AlertTriangle size={18} />}
          label="Contas atrasadas"
          value={`${summary.overdueCount} · ${formatCurrency(summary.overdueAmount)}`}
          tone="yellow"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Fluxo de caixa (por semana)</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Próximos vencimentos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Vencimento</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((tx) => (
                  <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-slate-800">{tx.description}</td>
                    <td className="px-5 py-3 text-slate-500">{contactName(tx.contactId)}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(tx.dueDate)}</td>
                    <td className={tx.type === "receivable" ? "px-5 py-3 text-emerald-600" : "px-5 py-3 text-red-600"}>
                      {tx.type === "receivable" ? "+" : "-"} {formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={STATUS_TONE[tx.status]}>{STATUS_LABEL[tx.status]}</Badge>
                    </td>
                  </tr>
                ))}
                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-6 text-center text-slate-400">
                      Nenhum lançamento pendente. Tudo em dia!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "indigo" | "green" | "red" | "yellow";
}) {
  const toneClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-red-50 text-red-600",
    yellow: "bg-amber-50 text-amber-600",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="truncate text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
