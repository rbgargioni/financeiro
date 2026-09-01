"use client";

import { FormEvent, useState } from "react";
import { Category, Contact, TransactionType } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

export interface TransactionFormValues {
  description: string;
  amount: number;
  dueDate: string;
  categoryId: string;
  contactId: string;
}

interface TransactionFormProps {
  type: TransactionType;
  categories: Category[];
  contacts: Contact[];
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onCancel: () => void;
}

export function TransactionForm({ type, categories, contacts, onSubmit, onCancel }: TransactionFormProps) {
  const relevantContacts = contacts.filter((c) => (type === "receivable" ? c.type === "client" : c.type === "supplier"));

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [contactId, setContactId] = useState(relevantContacts[0]?.id ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        description,
        amount: Number(amount),
        dueDate: new Date(dueDate).toISOString(),
        categoryId,
        contactId,
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
        <Label htmlFor="category">Categoria</Label>
        <Select id="category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="contact">{type === "receivable" ? "Cliente" : "Fornecedor"}</Label>
        <Select id="contact" value={contactId} onChange={(e) => setContactId(e.target.value)}>
          {relevantContacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar lançamento"}
        </Button>
      </div>
    </form>
  );
}
