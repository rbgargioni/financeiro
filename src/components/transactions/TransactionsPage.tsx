"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Check, Pencil, Trash2, Repeat } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Transaction, TransactionType, TransactionStatus, Category, Contact, CostCenter, BankAccount } from "@/lib/types";
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  markTransactionPaid,
  deleteTransaction,
} from "@/lib/data/transactions";
import { listCategories, createCategory } from "@/lib/data/categories";
import { listContacts, createContact } from "@/lib/data/contacts";
import { listCostCenters, createCostCenter } from "@/lib/data/cost-centers";
import { listBankAccounts, createBankAccount } from "@/lib/data/bank-accounts";
import { formatCurrency, formatDate } from "@/lib/utils";
import { generateRecurringDueDates } from "@/lib/recurrence";
import { STATUS_LABEL, STATUS_TONE } from "@/lib/status-labels";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
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
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionStatus | "all">("all");
  const [costCenterFilter, setCostCenterFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  async function reload() {
    if (!company) return;
    const [txs, cats, cts, ccs, bas] = await Promise.all([
      listTransactions(company.id),
      listCategories(company.id),
      listContacts(company.id),
      listCostCenters(company.id),
      listBankAccounts(company.id),
    ]);
    setTransactions(txs.filter((t) => t.type === type));
    setCategories(cats.filter((c) => c.type === type));
    setContacts(cts);
    setCostCenters(ccs);
    setBankAccounts(bas);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company, type]);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (filter !== "all" && t.status !== filter) return false;
        if (costCenterFilter === "none" && t.costCenterId) return false;
        if (costCenterFilter !== "all" && costCenterFilter !== "none" && t.costCenterId !== costCenterFilter) return false;
        return true;
      }),
    [transactions, filter, costCenterFilter]
  );

  const contactName = (id: string) => contacts.find((c) => c.id === id)?.name ?? "—";
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? "—";
  const costCenterName = (id: string | null) => (id ? costCenters.find((c) => c.id === id)?.name ?? "—" : "—");

  const exportColumns: ExportColumn[] = [
    { header: "Descrição", key: "description" },
    { header: type === "receivable" ? "Cliente" : "Fornecedor", key: "contact" },
    { header: "Categoria", key: "category" },
    { header: "Centro de Custo", key: "costCenter" },
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
        costCenter: costCenterName(tx.costCenterId),
        dueDate: formatDate(tx.dueDate),
        amount: formatCurrency(tx.amount),
        status: STATUS_LABEL[tx.status],
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, contacts, categories, costCenters]
  );

  async function handleFormSubmit(values: TransactionFormValues) {
    if (!company) return;

    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        description: values.description,
        amount: values.amount,
        dueDate: values.dueDate,
        categoryId: values.categoryId,
        contactId: values.contactId,
        costCenterId: values.costCenterId,
        bankAccountId: values.bankAccountId,
        status: values.paid ? "paid" : "pending",
        paidAt: values.paid ? values.paidAt : null,
      });
      setModalOpen(false);
      setEditingTransaction(null);
      await reload();
      return;
    }

    const base = {
      companyId: company.id,
      type,
      description: values.description,
      amount: values.amount,
      categoryId: values.categoryId,
      contactId: values.contactId,
      costCenterId: values.costCenterId,
      bankAccountId: values.bankAccountId,
    };

    if (values.recurring && values.recurrenceMonths > 1) {
      // Marking "already paid" only applies to a single launch — a recurring series' future
      // occurrences haven't happened yet, so they're always created pending.
      const recurrenceId = `rec-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const dueDates = generateRecurringDueDates(values.dueDate, values.recurrenceMonths);
      for (const dueDate of dueDates) {
        await createTransaction({ ...base, dueDate, status: "pending", paidAt: null, recurrenceId });
      }
    } else {
      await createTransaction({
        ...base,
        dueDate: values.dueDate,
        status: values.paid ? "paid" : "pending",
        paidAt: values.paid ? values.paidAt : null,
      });
    }
    setModalOpen(false);
    await reload();
  }

  function openCreateModal() {
    setEditingTransaction(null);
    setModalOpen(true);
  }

  function openEditModal(tx: Transaction) {
    setEditingTransaction(tx);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTransaction(null);
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

  async function handleCreateCostCenter(name: string): Promise<CostCenter> {
    if (!company) throw new Error("Empresa não carregada.");
    const costCenter = await createCostCenter({ companyId: company.id, name, description: "", active: true });
    setCostCenters((prev) => [...prev, costCenter]);
    return costCenter;
  }

  async function handleCreateBankAccount(name: string): Promise<BankAccount> {
    if (!company) throw new Error("Empresa não carregada.");
    const bankAccount = await createBankAccount({
      companyId: company.id,
      name,
      bank: "",
      agency: "",
      accountNumber: "",
      active: true,
    });
    setBankAccounts((prev) => [...prev, bankAccount]);
    return bankAccount;
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
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Novo lançamento
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
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
        {type === "payable" && (
          <Select
            className="w-auto min-w-[10rem]"
            value={costCenterFilter}
            onChange={(e) => setCostCenterFilter(e.target.value)}
          >
            <option value="all">Todos os centros de custo</option>
            <option value="none">Sem centro de custo</option>
            {costCenters.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Descrição</th>
              <th className="px-5 py-3 font-medium">{type === "receivable" ? "Cliente" : "Fornecedor"}</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              {type === "payable" && <th className="px-5 py-3 font-medium">Centro de Custo</th>}
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
                  {type === "payable" && (
                    <td className="px-5 py-3 text-slate-500">{costCenterName(tx.costCenterId)}</td>
                  )}
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
                        onClick={() => openEditModal(tx)}
                        title="Editar"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Pencil size={16} />
                      </button>
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
                <td colSpan={type === "payable" ? 8 : 7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum lançamento encontrado.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={type === "payable" ? 8 : 7} className="px-5 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingTransaction ? `Editar lançamento - ${title}` : `Novo lançamento - ${title}`}
      >
        <TransactionForm
          type={type}
          categories={categories}
          contacts={contacts}
          costCenters={costCenters}
          bankAccounts={bankAccounts}
          editing={editingTransaction}
          onCancel={closeModal}
          onSubmit={handleFormSubmit}
          onCreateCategory={handleCreateCategory}
          onCreateContact={handleCreateContact}
          onCreateCostCenter={handleCreateCostCenter}
          onCreateBankAccount={handleCreateBankAccount}
        />
      </Modal>
    </div>
  );
}
