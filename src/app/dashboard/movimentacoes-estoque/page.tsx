"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listStockMovements, createStockMovement, deleteStockMovement } from "@/lib/data/stock-movements";
import { listProducts } from "@/lib/data/products";
import { Product, StockMovement } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";
import { StockMovementForm, StockMovementFormValues } from "@/components/products/StockMovementForm";

export default function MovimentacoesEstoquePage() {
  const { company } = useAuth();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function reload() {
    if (!company) return;
    const [movs, prods] = await Promise.all([listStockMovements(company.id), listProducts(company.id)]);
    setMovements(movs);
    setProducts(prods);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const productName = (id: string) => products.find((p) => p.id === id)?.name ?? "—";
  const productUnit = (id: string) => products.find((p) => p.id === id)?.unit ?? "";

  async function handleSubmit(values: StockMovementFormValues) {
    if (!company) return;
    await createStockMovement({ companyId: company.id, ...values });
    setModalOpen(false);
    await reload();
  }

  async function handleDelete(movement: StockMovement) {
    await deleteStockMovement(movement);
    await reload();
  }

  const exportColumns: ExportColumn[] = [
    { header: "Data", key: "date" },
    { header: "Produto", key: "product" },
    { header: "Tipo", key: "type" },
    { header: "Quantidade", key: "quantity" },
    { header: "Motivo", key: "reason" },
  ];
  const exportRows = useMemo(
    () =>
      movements.map((m) => ({
        date: formatDate(m.date),
        product: productName(m.productId),
        type: m.type === "in" ? "Entrada" : "Saída",
        quantity: `${m.type === "in" ? "+" : "-"} ${m.quantity} ${productUnit(m.productId)}`,
        reason: m.reason,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [movements, products]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Movimentações de Estoque</h1>
          <p className="text-sm text-slate-500">Histórico de entradas e saídas de produtos.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="movimentacoes-estoque"
            title="Movimentações de Estoque"
            columns={exportColumns}
            rows={exportRows}
          />
          <Button onClick={() => setModalOpen(true)} disabled={products.length === 0}>
            <Plus size={16} />
            Nova movimentação
          </Button>
        </div>
      </div>

      {!loading && products.length === 0 && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Cadastre um produto em &quot;Produtos&quot; antes de registrar movimentações de estoque.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Quantidade</th>
              <th className="px-5 py-3 font-medium">Motivo</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              movements.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-500">{formatDate(m.date)}</td>
                  <td className="px-5 py-3 text-slate-800">{productName(m.productId)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={m.type === "in" ? "green" : "red"}>{m.type === "in" ? "Entrada" : "Saída"}</Badge>
                  </td>
                  <td className={m.type === "in" ? "px-5 py-3 text-emerald-600" : "px-5 py-3 text-red-600"}>
                    {m.type === "in" ? "+" : "-"} {m.quantity} {productUnit(m.productId)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{m.reason}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => handleDelete(m)}
                      title="Excluir e reverter"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            {!loading && movements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Nenhuma movimentação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova movimentação">
        <StockMovementForm products={products} onCancel={() => setModalOpen(false)} onSubmit={handleSubmit} />
      </Modal>
    </div>
  );
}
