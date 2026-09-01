"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, AlertTriangle, Package, PackageX } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listProducts, createProduct, updateProduct, deleteProduct } from "@/lib/data/products";
import { Product } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";
import { ProductForm, ProductFormValues } from "@/components/products/ProductForm";

export default function ProdutosPage() {
  const { company } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);

  async function reload() {
    if (!company) return;
    const list = await listProducts(company.id);
    setProducts(list);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const stats = useMemo(() => {
    const lowStock = products.filter((p) => p.quantity <= p.minStock);
    const totalValue = products.reduce((sum, p) => sum + p.quantity * p.unitCost, 0);
    return { total: products.length, lowStockCount: lowStock.length, totalValue };
  }, [products]);

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(product: Product) {
    setEditing(product);
    setModalOpen(true);
  }

  async function handleSubmit(values: ProductFormValues) {
    if (!company) return;
    if (editing) {
      await updateProduct(editing.id, values);
    } else {
      await createProduct({ companyId: company.id, ...values });
    }
    setModalOpen(false);
    setEditing(null);
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteProduct(id);
    await reload();
  }

  const exportColumns: ExportColumn[] = [
    { header: "SKU", key: "sku" },
    { header: "Produto", key: "name" },
    { header: "Categoria", key: "category" },
    { header: "Estoque", key: "stock" },
    { header: "Custo", key: "cost" },
    { header: "Preço", key: "price" },
  ];
  const exportRows = useMemo(
    () =>
      products.map((p) => ({
        sku: p.sku,
        name: p.name,
        category: p.category,
        stock: `${p.quantity} ${p.unit}`,
        cost: formatCurrency(p.unitCost),
        price: formatCurrency(p.unitPrice),
      })),
    [products]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Produtos</h1>
          <p className="text-sm text-slate-500">Controle o estoque e o valor dos produtos da sua empresa.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu filename="produtos" title="Produtos" columns={exportColumns} rows={exportRows} />
          <Button onClick={openCreate}>
            <Plus size={16} />
            Novo produto
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={<Package size={18} />} label="Produtos cadastrados" value={String(stats.total)} tone="indigo" />
        <StatCard icon={<AlertTriangle size={18} />} label="Com estoque baixo" value={String(stats.lowStockCount)} tone="yellow" />
        <StatCard icon={<PackageX size={18} />} label="Valor total em estoque" value={formatCurrency(stats.totalValue)} tone="green" />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">SKU</th>
              <th className="px-5 py-3 font-medium">Produto</th>
              <th className="px-5 py-3 font-medium">Categoria</th>
              <th className="px-5 py-3 font-medium">Estoque</th>
              <th className="px-5 py-3 font-medium">Custo</th>
              <th className="px-5 py-3 font-medium">Preço</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              products.map((p) => {
                const lowStock = p.quantity <= p.minStock;
                return (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-5 py-3 text-slate-500">{p.sku}</td>
                    <td className="px-5 py-3 text-slate-800">{p.name}</td>
                    <td className="px-5 py-3 text-slate-500">{p.category}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800">
                          {p.quantity} {p.unit}
                        </span>
                        {lowStock && <Badge tone="red">Estoque baixo</Badge>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatCurrency(p.unitCost)}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(p.unitPrice)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          title="Editar"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          title="Excluir"
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  Nenhum produto cadastrado ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditing(null);
        }}
        title={editing ? "Editar produto" : "Novo produto"}
      >
        <ProductForm
          initial={editing ?? undefined}
          onCancel={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      </Modal>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "indigo" | "green" | "yellow";
}) {
  const toneClasses: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600",
    green: "bg-emerald-50 text-emerald-600",
    yellow: "bg-amber-50 text-amber-600",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClasses[tone]}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">{label}</p>
          <p className="truncate text-lg font-semibold text-slate-900">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
