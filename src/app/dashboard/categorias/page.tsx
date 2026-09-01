"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listCategories, createCategory, deleteCategory } from "@/lib/data/categories";
import { Category, CategoryType } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export default function CategoriasPage() {
  const { company } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<CategoryType>("receivable");

  async function reload() {
    if (!company) return;
    const cats = await listCategories(company.id);
    setCategories(cats);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    await createCategory({ companyId: company.id, name, type });
    setName("");
    setModalOpen(false);
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteCategory(id);
    await reload();
  }

  const receivableCategories = categories.filter((c) => c.type === "receivable");
  const payableCategories = categories.filter((c) => c.type === "payable");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Categorias</h1>
          <p className="text-sm text-slate-500">Organize suas contas a pagar e a receber por categoria.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nova categoria
        </Button>
      </div>

      {!loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <CategoryList title="Receitas" categories={receivableCategories} onDelete={handleDelete} />
          <CategoryList title="Despesas" categories={payableCategories} onDelete={handleDelete} />
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nova categoria">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cat-name">Nome</Label>
            <Input id="cat-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cat-type">Tipo</Label>
            <Select id="cat-type" value={type} onChange={(e) => setType(e.target.value as CategoryType)}>
              <option value="receivable">Receita</option>
              <option value="payable">Despesa</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Salvar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function CategoryList({
  title,
  categories,
  onDelete,
}: {
  title: string;
  categories: Category[];
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-3">
        {categories.map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
            <span className="text-sm text-slate-700">{c.name}</span>
            <button
              onClick={() => onDelete(c.id)}
              className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {categories.length === 0 && <p className="px-2 py-4 text-sm text-slate-400">Nenhuma categoria cadastrada.</p>}
      </CardContent>
    </Card>
  );
}
