"use client";

import { FormEvent, useState } from "react";
import { Category, Contact, TransactionType } from "@/lib/types";
import { dateInputToIso } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

export interface TransactionFormValues {
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  contactId: string;
  recurring: boolean;
  recurrenceMonths: number;
}

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  contacts: Contact[];
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
  onCreateCategory: (name: string) => Promise<Category>;
  onCreateContact: (name: string) => Promise<Contact>;
}

export function TransactionForm({
  type,
  categories,
  contacts,
  onSubmit,
  onCancel,
  onCreateCategory,
  onCreateContact,
}: TransactionFormProps) {
  const relevantContacts = contacts.filter((c) => (type === "receivable" ? c.type === "client" : c.type === "supplier"));

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [contactId, setContactId] = useState(relevantContacts[0]?.id ?? "");
  const [recurring, setRecurring] = useState(false);
  const [recurrenceMonths, setRecurrenceMonths] = useState("12");
  const [submitting, setSubmitting] = useState(false);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);

  const [addingContact, setAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);

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

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || !categoryId || !contactId}>
          {submitting ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}
