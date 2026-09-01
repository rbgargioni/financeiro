"use client";

import { FormEvent, useState } from "react";
import { Product, StockMovementType } from "@/lib/types";
import { dateInputToIso, todayDateInputValue } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";

export interface StockMovementFormValues {
  productId: string;
  type: StockMovementType;
  quantity: number;
  reason: string;
  date: string;
}

interface StockMovementFormProps {
  products: Product[];
  onSubmit: (values: StockMovementFormValues) => Promise<void>;
  onCancel: () => void;
}

export function StockMovementForm({ products, onSubmit, onCancel }: StockMovementFormProps) {
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [type, setType] = useState<StockMovementType>("in");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(todayDateInputValue());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedProduct = products.find((p) => p.id === productId);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const qty = Number(quantity);
    if (type === "out" && selectedProduct && qty > selectedProduct.quantity) {
      setError(`Estoque atual é de ${selectedProduct.quantity} ${selectedProduct.unit}. Não é possível dar saída de ${qty}.`);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        productId,
        type,
        quantity: qty,
        reason,
        date: dateInputToIso(date),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="movement-product">Produto</Label>
        <Select id="movement-product" value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.quantity} {p.unit} em estoque)
            </option>
          ))}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="movement-type">Tipo</Label>
          <Select id="movement-type" value={type} onChange={(e) => setType(e.target.value as StockMovementType)}>
            <option value="in">Entrada</option>
            <option value="out">Saída</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="movement-quantity">Quantidade</Label>
          <Input
            id="movement-quantity"
            type="number"
            min="1"
            step="1"
            required
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="movement-date">Data</Label>
        <Input id="movement-date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="movement-reason">Motivo</Label>
        <Input
          id="movement-reason"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={type === "in" ? "Ex: Compra de fornecedor" : "Ex: Venda, perda, ajuste"}
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting || !productId}>
          {submitting ? "Salvando..." : "Registrar movimentação"}
        </Button>
      </div>
    </form>
  );
}
