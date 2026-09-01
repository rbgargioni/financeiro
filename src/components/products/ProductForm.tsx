"use client";

import { FormEvent, useState } from "react";
import { Product } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

export interface ProductFormValues {
  sku: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  unitCost: number;
  unitPrice: number;
  minStock: number;
}

interface ProductFormProps {
  initial?: Product;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProductForm({ initial, onSubmit, onCancel }: ProductFormProps) {
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [unit, setUnit] = useState(initial?.unit ?? "un");
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 0));
  const [unitCost, setUnitCost] = useState(String(initial?.unitCost ?? ""));
  const [unitPrice, setUnitPrice] = useState(String(initial?.unitPrice ?? ""));
  const [minStock, setMinStock] = useState(String(initial?.minStock ?? 0));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        sku,
        name,
        category,
        unit,
        // Editing never changes stock quantity here — that only happens via
        // "Nova movimentação", so the original value is passed through as-is.
        quantity: initial ? initial.quantity : Number(quantity),
        unitCost: Number(unitCost),
        unitPrice: Number(unitPrice),
        minStock: Number(minStock),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-sku">SKU / Código</Label>
          <Input id="product-sku" required value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="product-category">Categoria</Label>
          <Input id="product-category" required value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Ex: Bebidas" />
        </div>
      </div>
      <div>
        <Label htmlFor="product-name">Nome do produto</Label>
        <Input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className={initial ? "grid grid-cols-2 gap-4" : "grid grid-cols-3 gap-4"}>
        <div>
          <Label htmlFor="product-unit">Unidade</Label>
          <Input id="product-unit" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="un, kg, cx" />
        </div>
        {!initial && (
          <div>
            <Label htmlFor="product-quantity">Qtd. inicial</Label>
            <Input
              id="product-quantity"
              type="number"
              min="0"
              step="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
        )}
        <div>
          <Label htmlFor="product-min-stock">Estoque mínimo</Label>
          <Input
            id="product-min-stock"
            type="number"
            min="0"
            step="1"
            required
            value={minStock}
            onChange={(e) => setMinStock(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="product-cost">Custo unitário (R$)</Label>
          <Input
            id="product-cost"
            type="number"
            min="0"
            step="0.01"
            required
            value={unitCost}
            onChange={(e) => setUnitCost(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="product-price">Preço de venda (R$)</Label>
          <Input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            required
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
          />
        </div>
      </div>
      {initial && (
        <p className="text-xs text-slate-400">
          Para ajustar a quantidade em estoque, use "Nova movimentação" em vez de editar aqui.
        </p>
      )}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Salvando..." : "Salvar produto"}
        </Button>
      </div>
    </form>
  );
}
