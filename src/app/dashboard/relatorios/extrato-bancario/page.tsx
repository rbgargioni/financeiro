"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listTransactions, updateTransactionReconciled } from "@/lib/data/transactions";
import { listContacts } from "@/lib/data/contacts";
import { listCategories } from "@/lib/data/categories";
import { listCostCenters } from "@/lib/data/cost-centers";
import { listBankAccounts } from "@/lib/data/bank-accounts";
import { BankAccount, Category, Contact, CostCenter, Transaction } from "@/lib/types";
import { buildBankStatement } from "@/lib/reports";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Input, Label, Select } from "@/components/ui/Input";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";

export default function ExtratoBancarioPage() {
  const { company } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [bankAccountFilter, setBankAccountFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  async function reload() {
    if (!company) return;
    const [txs, cts, cats, ccs, bas] = await Promise.all([
      listTransactions(company.id),
      listContacts(company.id),
      listCategories(company.id),
      listCostCenters(company.id),
      listBankAccounts(company.id),
    ]);
    setTransactions(txs);
    setContacts(cts);
    setCategories(cats);
    setCostCenters(ccs);
    setBankAccounts(bas);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  useEffect(() => {
    if (bankAccountFilter !== "all" || bankAccounts.length === 0) return;
    const firstActive = bankAccounts.find((b) => b.active);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (firstActive) setBankAccountFilter(firstActive.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankAccounts]);

  const statement = useMemo(
    () =>
      buildBankStatement(transactions, {
        bankAccountId: bankAccountFilter as "all" | "none" | string,
        from: dateFrom || undefined,
        to: dateTo || undefined,
      }),
    [transactions, bankAccountFilter, dateFrom, dateTo]
  );

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const costCenterName = (id: string | null) => (id ? costCenters.find((c) => c.id === id)?.name ?? "—" : "—");
  const bankAccountName = (id: string | null) => (id ? bankAccounts.find((b) => b.id === id)?.name ?? "—" : "—");

  async function toggleReconciled(tx: Transaction) {
    await updateTransactionReconciled(tx.id, !tx.reconciled);
    await reload();
  }

  const exportColumns: ExportColumn[] = [
    { header: "Data", key: "date" },
    { header: "Cliente/Fornecedor", key: "contact" },
    { header: "Descrição", key: "description" },
    { header: "Categoria", key: "category" },
    { header: "Centro de Custo", key: "costCenter" },
    { header: "Conta Bancária", key: "bankAccount" },
    { header: "Conciliado", key: "reconciled" },
    { header: "Valor", key: "amount" },
    { header: "Saldo acumulado", key: "running" },
  ];
  const exportRows = useMemo(
    () =>
      statement.rows.map(({ transaction: tx, signedAmount, running }) => ({
        date: formatDate(tx.paidAt!),
        contact: contactName(tx.contactId),
        description: tx.description,
        category: categoryName(tx.categoryId),
        costCenter: costCenterName(tx.costCenterId),
        bankAccount: bankAccountName(tx.bankAccountId),
        reconciled: tx.reconciled ? "Sim" : "Não",
        amount: `${signedAmount >= 0 ? "+" : "-"} ${formatCurrency(Math.abs(signedAmount))}`,
        running: formatCurrency(running),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statement, contacts, categories, costCenters, bankAccounts]
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Relatórios</p>
        <h1 className="text-xl font-semibold text-slate-900">Extrato Bancário</h1>
        <p className="text-sm text-slate-500">
          Movimentações já realizadas (pagas/recebidas) em cada conta, com saldo acumulado e conciliação.
        </p>
      </div>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
            <div>
              <Label htmlFor="filter-account">Conta bancária</Label>
              <Select id="filter-account" value={bankAccountFilter} onChange={(e) => setBankAccountFilter(e.target.value)}>
                <option value="all">Todas as contas</option>
                <option value="none">Sem conta bancária</option>
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-from">De</Label>
              <Input id="filter-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filter-to">Até</Label>
              <Input id="filter-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="flex items-end justify-end">
              <ExportMenu
                filename="extrato-bancario"
                title="Extrato Bancário"
                columns={exportColumns}
                rows={exportRows}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
        <span className="text-sm text-slate-500">Saldo anterior</span>
        <span className="text-sm font-semibold text-slate-900">{formatCurrency(statement.openingBalance)}</span>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-4 py-3 font-medium"></th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Cliente/Fornecedor</th>
              <th className="px-4 py-3 font-medium">Descrição</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Centro de Custo</th>
              {bankAccountFilter === "all" && <th className="px-4 py-3 font-medium">Conta Bancária</th>}
              <th className="px-4 py-3 font-medium text-center">Conc.</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Saldo acumulado</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              statement.rows.map(({ transaction: tx, signedAmount, running }) => (
                <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-2">
                    {tx.type === "receivable" ? (
                      <ArrowDownCircle size={16} className="text-emerald-600" />
                    ) : (
                      <ArrowUpCircle size={16} className="text-red-600" />
                    )}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(tx.paidAt!)}</td>
                  <td className="px-4 py-2 text-slate-500">{contactName(tx.contactId)}</td>
                  <td className="px-4 py-2 text-slate-800">{tx.description}</td>
                  <td className="px-4 py-2 text-slate-500">{categoryName(tx.categoryId)}</td>
                  <td className="px-4 py-2 text-slate-500">{costCenterName(tx.costCenterId)}</td>
                  {bankAccountFilter === "all" && (
                    <td className="px-4 py-2 text-slate-500">{bankAccountName(tx.bankAccountId)}</td>
                  )}
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => toggleReconciled(tx)}
                      title={tx.reconciled ? "Conciliado — clique para desfazer" : "Marcar como conciliado"}
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${
                        tx.reconciled ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {tx.reconciled ? <Check size={14} /> : <X size={14} />}
                    </button>
                  </td>
                  <td className={`px-4 py-2 whitespace-nowrap font-medium ${signedAmount >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {signedAmount >= 0 ? "+" : "-"} {formatCurrency(Math.abs(signedAmount))}
                  </td>
                  <td className="px-4 py-2 whitespace-nowrap font-medium text-slate-800">{formatCurrency(running)}</td>
                </tr>
              ))}
            {!loading && statement.rows.length === 0 && (
              <tr>
                <td colSpan={bankAccountFilter === "all" ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                  Nenhuma movimentação encontrada para esse filtro.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={bankAccountFilter === "all" ? 9 : 8} className="px-4 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
