"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Trash2, Repeat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, TransactionType, TransactionStatus, Category, Contact } from "@/lib/types";
import { listTransactions, createTransaction, markTransactionPaid, deleteTransaction } from "@/lib/data/transactions";
import { listCategories, createCategory } from "@/lib/data/categories";
import { listContacts, createContact } from "@/lib/data/contacts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateRecurringDueDates } from "@/lib/recurrence";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status-labels";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";
import { TransactionForm, TransactionFormValues } from "./TransactionForm";

const FILTERS: { value: TransactionStatus | "all"; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pending", label: "Pendentes" },
  { value: "overdue", label: "Atrasados" },
  { value: "paid", label: "Pagos" },
];

interface TransactionsPageProps {
  type: TransactionType;
  title: string;
  description: string;
}

export function TransactionsPage({ type, title, description }: TransactionsPageProps) {
  const { company } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | "all">("all");
  const [modalOpen, setModalOpen] = useState(false);

  async function reload() {
    if (!company) return;
    const [txs, cats, cts] = await Promise.all([
      listTransactions(company.id),
      listCategories(company.id),
      listContacts(company.id),
    ]);
    setTransactions(txs.filter((t) => t.type === type));
    setCategories(cats.filter((c) => c.type === type));
    setContacts(cts);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, type]);

  const filtered = useMemo(
    () => (filter === "all" ? transactions : transactions.filter((t) => t.status === filter)),
    [transactions, filter]
  );

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";

  const exportColumns: ExportColumn[] = [
    { header: "Descrição", key: "description" },
    { header: type === "receivable" ? "Cliente" : "Fornecedor", key: "contact" },
    { header: "Categoria", key: "category" },
    { header: "Vencimento", key: "dueDate" },
    { header: "Valor", key: "amount" },
    { header: "Status", key: "status" },
  ];
  const exportRows = useMemo(
    () =>
      filtered.map((tx) => ({
        description: tx.description,
        contact: contactName(tx.contactId),
        category: categoryName(tx.categoryId),
        dueDate: formatDate(tx.dueDate),
        amount: formatCurrency(tx.amount),
        status: STATUS_LABEL[tx.status],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, contacts, categories]
  );

  async function handleCreate(values: TransactionFormValues) {
    if (!company) return;
    const base = {
      companyId: company.id,
      type,
      description: values.description,
      amount: values.amount,
      paidAt: null,
      status: "pending" as const,
      categoryId: values.categoryId,
      contactId: values.contactId,
    };

    if (values.recurring && values.recurrenceMonths > 1) {
      const recurrenceId = `rec-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const dueDates = generateRecurringDueDates(values.dueDate, values.recurrenceMonths);
      for (const dueDate of dueDates) {
        await createTransaction({ ...base, dueDate, recurrenceId });
      }
    } else {
      await createTransaction({ ...base, dueDate: values.dueDate });
    }
    setModalOpen(false);
    await reload();
  }

  async function handleCreateCategory(name: string): Promise<Category> {
    if (!company) throw new Error("Empresa não carregada.");
    const category = await createCategory({ companyId: company.id, name, type });
    setCategories((prev) => [...prev, category]);
    return category;
  }

  async function handleCreateContact(name: string): Promise<Contact> {
    if (!company) throw new Error("Empresa não carregada.");
    const contactType = type === "receivable" ? "client" : "supplier";
    const contact = await createContact({ companyId: company.id, name, type: contactType, document: "", email: "", phone: "" });
    setContacts((prev) => [...prev, contact]);
    return contact;
  }

  async function handleMarkPaid(id: string) {
    await markTransactionPaid(id);
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteTransaction(id);
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename={type === "receivable" ? "contas-a-receber" : "contas-a-pagar"}
            title={title}
            columns={exportColumns}
            rows={exportRows}
          />
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={16} />
            Novo lançamento
          </Button>
        </div>
      </div>

      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
            } border border-slate-200`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">{type === "receivable" ? "Cliente" : "Fornecedor"}</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              filtered.map((tx) => (
                <tr key={tx.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">
                    <span className="inline-flex items-center gap-1.5">
                      {tx.description}
                      {tx.recurrenceId && (
                        <span title="Lançamento recorrente" className="shrink-0 text-slate-400">
                          <Repeat size={13} />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{contactName(tx.contactId)}</td>
                  <td className="px-5 py-3 text-slate-500">{categoryName(tx.categoryId)}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(tx.dueDate)}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(tx.amount)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={STATUS_TONE[tx.status]}>{STATUS_LABEL[tx.status]}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      {tx.status !== "paid" && (
                        <button
                          onClick={() => handleMarkPaid(tx.id)}
                          title="Marcar como pago"
                          className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                        >
                          <Check size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(tx.id)}
                        title="Excluir"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Novo lançamento - ${title}`}>
        <TransactionForm
          type={type}
          categories={categories}
          contacts={contacts}
          onCancel={() => setModalOpen(false)}
          onSubmit={handleCreate}
          onCreateCategory={handleCreateCategory}
          onCreateContact={handleCreateContact}
        />
      </Modal>
    </div>
  );
}
