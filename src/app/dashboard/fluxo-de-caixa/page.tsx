"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listTransactions } from "@/lib/data/transactions";
import { listContacts } from "@/lib/data/contacts";
import { Transaction, Contact } from "@/lib/types";
import { buildWeeklyCashFlow } from "@/lib/reports";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CashFlowChart } from "@/components/charts/CashFlowChart";

export default function FluxoDeCaixaPage() {
  const { company } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!company) return;
    let active = true;
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

  const chartData = useMemo(() => buildWeeklyCashFlow(transactions), [transactions]);
  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";

  const rows = useMemo(() => {
    const sorted = [...transactions]
      .filter((t) => t.status === "paid")
      .sort((a, b) => new Date(a.paidAt ?? a.dueDate).getTime() - new Date(b.paidAt ?? b.dueDate).getTime());
    let running = 0;
    return sorted.map((tx) => {
      running += tx.type === "receivable" ? tx.amount : -tx.amount;
      return { tx, running };
    });
  }, [transactions]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Fluxo de Caixa</h1>
        <p className="text-sm text-slate-500">Entradas e saídas realizadas, com saldo acumulado.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Previsão de entradas e saídas por semana</CardTitle>
        </CardHeader>
        <CardContent>
          <CashFlowChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações realizadas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Contato</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                  <th className="px-5 py-3 font-medium">Saldo acumulado</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  rows.map(({ tx, running }) => (
                    <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 text-slate-500">{formatDate(tx.paidAt ?? tx.dueDate)}</td>
                      <td className="px-5 py-3 text-slate-800">{tx.description}</td>
                      <td className="px-5 py-3 text-slate-500">{contactName(tx.contactId)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={tx.type === "receivable" ? "green" : "red"}>
                          {tx.type === "receivable" ? "Entrada" : "Saída"}
                        </Badge>
                      </td>
                      <td className={tx.type === "receivable" ? "px-5 py-3 text-emerald-600" : "px-5 py-3 text-red-600"}>
                        {tx.type === "receivable" ? "+" : "-"} {formatCurrency(tx.amount)}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(running)}</td>
                    </tr>
                  ))}
                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Nenhuma movimentação realizada ainda.
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
