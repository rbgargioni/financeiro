"use client";

import { FormEvent, useState } from "react";
import { BankAccount, Category, Contact, CostCenter, Transaction, TransactionType } from "@/lib/types";
import { dateInputToIso, isoToDateInputValue, todayDateInputValue } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

export interface TransactionFormValues {
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  contactId: string;
  costCenterId: string | null;
  bankAccountId: string | null;
  paid: boolean;
  paidAt: string | null;
  recurring: boolean;
  recurrenceMonths: number;
}

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  contacts: Contact[];
  costCenters: CostCenter[];
  bankAccounts: BankAccount[];
  editing?: Transaction | null;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  onCreateCategory: (name: string) => Promise<Category>;
  onCreateContact: (name: string) => Promise<Contact>;
  onCreateCostCenter: (name: string) => Promise<CostCenter>;
  onCreateBankAccount: (name: string) => Promise<BankAccount>;
}

export function TransactionForm({
  type,
  categories,
  contacts,
  costCenters,
  bankAccounts,
  editing,
  onSubmit,
  onCancel,
  onCreateCategory,
  onCreateContact,
  onCreateCostCenter,
  onCreateBankAccount,
}: TransactionFormProps) {
  const relevantContacts = contacts.filter((c) => (type === "receivable" ? c.type === "client" : c.type === "supplier"));
  const activeCostCenters = costCenters.filter((cc) => cc.active);
  const costCenterRequired = type === "payable";
  // Editing a transaction whose cost center was since deactivated: keep it selectable so saving
  // without touching this field doesn't silently reassign it.
  const selectableCostCenters =
    editing?.costCenterId && !activeCostCenters.some((cc) => cc.id === editing.costCenterId)
      ? [...activeCostCenters, ...costCenters.filter((cc) => cc.id === editing.costCenterId)]
      : activeCostCenters;
  const activeBankAccounts = bankAccounts.filter((b) => b.active);
  const selectableBankAccounts =
    editing?.bankAccountId && !activeBankAccounts.some((b) => b.id === editing.bankAccountId)
      ? [...activeBankAccounts, ...bankAccounts.filter((b) => b.id === editing.bankAccountId)]
      : activeBankAccounts;

  const [description, setDescription] = useState(editing?.description ?? "");
  const [amount, setAmount] = useState(editing ? String(editing.amount) : "");
  const [dueDate, setDueDate] = useState(editing ? isoToDateInputValue(editing.dueDate) : "");
  const [categoryId, setCategoryId] = useState(editing?.categoryId ?? categories[0]?.id ?? "");
  const [contactId, setContactId] = useState(editing?.contactId ?? relevantContacts[0]?.id ?? "");
  const [costCenterId, setCostCenterId] = useState(
    editing ? editing.costCenterId ?? "" : costCenterRequired ? activeCostCenters[0]?.id ?? "" : ""
  );
  const [bankAccountId, setBankAccountId] = useState(editing?.bankAccountId ?? "");
  const [paid, setPaid] = useState(editing ? editing.status === "paid" : false);
  const [paidAt, setPaidAtInput] = useState(
    editing?.paidAt ? isoToDateInputValue(editing.paidAt) : todayDateInputValue()
  );
  const [recurring, setRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [addingContact, setAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);

  const [addingCostCenter, setAddingCostCenter] = useState(false);
  const [newCostCenterName, setNewCostCenterName] = useState("");
  const [creatingCostCenter, setCreatingCostCenter] = useState(false);

  const [addingBankAccount, setAddingBankAccount] = useState(false);
  const [newBankAccountName, setNewBankAccountName] = useState("");
  const [creatingBankAccount, setCreatingBankAccount] = useState(false);

  async function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setCreatingCategory(true);
    try {
      const category = await onCreateCategory(name);
      setCategoryId(category.id);
      setNewCategoryName("");
      setAddingCategory(false);
    } finally {
      setCreatingCategory(false);
    }
  }

  async function handleAddContact() {
    const name = newContactName.trim();
    if (!name) return;
    setCreatingContact(true);
    try {
      const contact = await onCreateContact(name);
      setContactId(contact.id);
      setNewContactName("");
      setAddingContact(false);
    } finally {
      setCreatingContact(false);
    }
  }

  async function handleAddCostCenter() {
    const name = newCostCenterName.trim();
    if (!name) return;
    setCreatingCostCenter(true);
    try {
      const costCenter = await onCreateCostCenter(name);
      setCostCenterId(costCenter.id);
      setNewCostCenterName("");
      setAddingCostCenter(false);
    } finally {
      setCreatingCostCenter(false);
    }
  }

  async function handleAddBankAccount() {
    const name = newBankAccountName.trim();
    if (!name) return;
    setCreatingBankAccount(true);
    try {
      const bankAccount = await onCreateBankAccount(name);
      setBankAccountId(bankAccount.id);
      setNewBankAccountName("");
      setAddingBankAccount(false);
    } finally {
      setCreatingBankAccount(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        description,
        amount: Number(amount),
        dueDate: dateInputToIso(dueDate),
        categoryId,
        contactId,
        costCenterId: costCenterId || null,
        bankAccountId: bankAccountId || null,
        paid,
        paidAt: paid ? dateInputToIso(paidAt) : null,
        recurring,
        recurrenceMonths: Number(recurrenceMonths) || 1,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="description">Descrição</Label>
        <Input
          id="description"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={type === "receivable" ? "Ex: Venda para cliente X" : "Ex: Pagamento de fornecedor"}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Valor (R$)</Label>
          <Input
            id="amount"
            type="number"
            min="0"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="dueDate">Vencimento</Label>
          <Input
            id="dueDate"
            type="date"
            required
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="category" className="mb-0">
            Categoria
          </Label>
          <button
            type="button"
            onClick={() => setAddingCategory((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {addingCategory ? "Cancelar" : "+ Nova categoria"}
          </button>
        </div>
        {addingCategory ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Nome da categoria"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCategory();
                }
              }}
            />
            <Button type="button" size="sm" onClick={handleAddCategory} disabled={creatingCategory || !newCategoryName.trim()}>
              Adicionar
            </Button>
          </div>
        ) : (
          <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.length === 0 && <option value="">Nenhuma categoria cadastrada</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="costCenter" className="mb-0">
            Centro de Custo{costCenterRequired ? "" : " (opcional)"}
          </Label>
          <button
            type="button"
            onClick={() => setAddingCostCenter((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {addingCostCenter ? "Cancelar" : "+ Novo centro de custo"}
          </button>
        </div>
        {addingCostCenter ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newCostCenterName}
              onChange={(e) => setNewCostCenterName(e.target.value)}
              placeholder="Nome do centro de custo"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCostCenter();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddCostCenter}
              disabled={creatingCostCenter || !newCostCenterName.trim()}
            >
              Adicionar
            </Button>
          </div>
        ) : (
          <Select
            id="costCenter"
            required={costCenterRequired}
            value={costCenterId}
            onChange={(e) => setCostCenterId(e.target.value)}
          >
            {(!costCenterRequired || !costCenterId) && (
              <option value="" disabled={costCenterRequired}>
                {selectableCostCenters.length === 0
                  ? "Nenhum centro de custo cadastrado"
                  : costCenterRequired
                    ? "Selecione um centro de custo"
                    : "Nenhum"}
              </option>
            )}
            {selectableCostCenters.map((cc) => (
              <option key={cc.id} value={cc.id}>
                {cc.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="bankAccount" className="mb-0">
            Conta Bancária (opcional)
          </Label>
          <button
            type="button"
            onClick={() => setAddingBankAccount((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {addingBankAccount ? "Cancelar" : "+ Nova conta bancária"}
          </button>
        </div>
        {addingBankAccount ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newBankAccountName}
              onChange={(e) => setNewBankAccountName(e.target.value)}
              placeholder="Nome da conta bancária"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddBankAccount();
                }
              }}
            />
            <Button
              type="button"
              size="sm"
              onClick={handleAddBankAccount}
              disabled={creatingBankAccount || !newBankAccountName.trim()}
            >
              Adicionar
            </Button>
          </div>
        ) : (
          <Select id="bankAccount" value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}>
            <option value="">{selectableBankAccounts.length === 0 ? "Nenhuma conta cadastrada" : "Nenhuma"}</option>
            {selectableBankAccounts.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <Label htmlFor="contact" className="mb-0">
            {type === "receivable" ? "Cliente" : "Fornecedor"}
          </Label>
          <button
            type="button"
            onClick={() => setAddingContact((v) => !v)}
            className="text-xs font-medium text-indigo-600 hover:underline"
          >
            {addingContact ? "Cancelar" : `+ Novo ${type === "receivable" ? "cliente" : "fornecedor"}`}
          </button>
        </div>
        {addingContact ? (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder={type === "receivable" ? "Nome do cliente" : "Nome do fornecedor"}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddContact();
                }
              }}
            />
            <Button type="button" size="sm" onClick={handleAddContact} disabled={creatingContact || !newContactName.trim()}>
              Adicionar
            </Button>
          </div>
        ) : (
          <Select id="contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
            {relevantContacts.length === 0 && <option value="">Nenhum cadastrado</option>}
            {relevantContacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {!recurring && (
        <div className="rounded-lg border border-slate-200 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={paid} onChange={(e) => setPaid(e.target.checked)} />
            {type === "receivable" ? "Já foi recebido" : "Já foi pago"}
          </label>
          {paid && (
            <div className="mt-3">
              <Label htmlFor="paidAt">Data de {type === "receivable" ? "recebimento" : "pagamento"}</Label>
              <Input
                id="paidAt"
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAtInput(e.target.value)}
              />
            </div>
          )}
        </div>
      )}

      {!editing && (
        <div className="rounded-lg border border-slate-200 p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} />
            Repetir mensalmente
          </label>
          {recurring && (
            <div className="mt-3">
              <Label htmlFor="recurrenceMonths">Por quantos meses (incluindo este)</Label>
              <Input
                id="recurrenceMonths"
                type="number"
                min="2"
                max="60"
                value={recurrenceMonths}
                onChange={(e) => setRecurrenceMonths(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">
                Cria automaticamente um lançamento igual a este todo mês, mesmo dia, pelo número de meses informado.
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            submitting ||
            !categoryId ||
            !contactId ||
            (costCenterRequired && !costCenterId) ||
            (paid && !recurring && !paidAt)
          }
        >
          {submitting ? "Salvando..." : editing ? "Salvar alterações" : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}
