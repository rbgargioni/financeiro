"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listCostCenters, createCostCenter, updateCostCenter, deleteCostCenter } from "@/lib/data/cost-centers";
import { listCategories } from "@/lib/data/categories";
import { listTransactions } from "@/lib/data/transactions";
import { CostCenter, Category, Transaction, TransactionStatus } from "@/lib/types";
import { groupPayablesByCostCenter } from "@/lib/reports";
import { formatCurrency } from "@/lib/utils";
import { STATUS_LABEL } from "@/lib/status-labels";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";
import { CostCenterChart } from "@/components/charts/CostCenterChart";

function isoDateOnly(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function CentrosDeCustoPage() {
  const { company } = useAuth();
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CostCenter | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterCostCenter, setFilterCostCenter] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");

  async function reload() {
    if (!company) return;
    const [ccList, catList, txList] = await Promise.all([
      listCostCenters(company.id),
      listCategories(company.id),
      listTransactions(company.id),
    ]);
    setCostCenters(ccList);
    setCategories(catList);
    setTransactions(txList);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  function openCreateModal() {
    setEditing(null);
    setName("");
    setDescription("");
    setActive(true);
    setModalOpen(true);
  }

  function openEditModal(cc: CostCenter) {
    setEditing(cc);
    setName(cc.name);
    setDescription(cc.description);
    setActive(cc.active);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      if (editing) {
        await updateCostCenter(editing.id, { name, description, active });
      } else {
        await createCostCenter({ companyId: company.id, name, description, active });
      }
      setModalOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(cc: CostCenter) {
    await updateCostCenter(cc.id, { active: !cc.active });
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteCostCenter(id);
    await reload();
  }

  const payableCategories = categories.filter((c) => c.type === "payable");

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (tx.type !== "payable") return false;
      if (dateFrom && isoDateOnly(tx.dueDate) < dateFrom) return false;
      if (dateTo && isoDateOnly(tx.dueDate) > dateTo) return false;
      if (filterCostCenter === "none" && tx.costCenterId) return false;
      if (filterCostCenter !== "all" && filterCostCenter !== "none" && tx.costCenterId !== filterCostCenter) return false;
      if (filterCategory !== "all" && tx.categoryId !== filterCategory) return false;
      if (filterStatus !== "all" && tx.status !== filterStatus) return false;
      return true;
    });
  }, [transactions, dateFrom, dateTo, filterCostCenter, filterCategory, filterStatus]);

  const totals = useMemo(
    () => groupPayablesByCostCenter(filteredTransactions, costCenters),
    [filteredTransactions, costCenters]
  );

  const costCenterExportColumns: ExportColumn[] = [
    { header: "Nome", key: "name" },
    { header: "Descrição", key: "description" },
    { header: "Status", key: "status" },
  ];
  const costCenterExportRows = useMemo(
    () =>
      costCenters.map((cc) => ({
        name: cc.name,
        description: cc.description,
        status: cc.active ? "Ativo" : "Inativo",
      })),
    [costCenters]
  );

  const reportExportColumns: ExportColumn[] = [
    { header: "Centro de custo", key: "name" },
    { header: "Total de despesas", key: "total" },
  ];
  const reportExportRows = useMemo(
    () => totals.map((t) => ({ name: t.name, total: formatCurrency(t.total) })),
    [totals]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Centros de Custo</h1>
          <p className="text-sm text-slate-500">
            Organize as despesas por área ou projeto — independente da categoria (o que foi gasto), o centro de
            custo indica para onde o dinheiro foi.
          </p>
        </div>
        <div className="flex gap-2">
          <ExportMenu
            filename="centros-de-custo"
            title="Centros de Custo"
            columns={costCenterExportColumns}
            rows={costCenterExportRows}
          />
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Novo centro de custo
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  costCenters.map((cc) => (
                    <tr key={cc.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-800">{cc.name}</td>
                      <td className="px-5 py-3 text-slate-500">{cc.description || "—"}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleActive(cc)}>
                          <Badge tone={cc.active ? "green" : "slate"}>{cc.active ? "Ativo" : "Inativo"}</Badge>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(cc)}
                            title="Editar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(cc.id)}
                            title="Excluir"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && costCenters.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      Nenhum centro de custo cadastrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gastos por Centro de Custo</CardTitle>
          <ExportMenu
            filename="gastos-por-centro-de-custo"
            title="Gastos por Centro de Custo"
            columns={reportExportColumns}
            rows={reportExportRows}
          />
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div>
              <Label htmlFor="date-from">De</Label>
              <Input id="date-from" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="date-to">Até</Label>
              <Input id="date-to" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="filter-cc">Centro de custo</Label>
              <Select id="filter-cc" value={filterCostCenter} onChange={(e) => setFilterCostCenter(e.target.value)}>
                <option value="all">Todos</option>
                <option value="none">Sem centro de custo</option>
                {costCenters.map((cc) => (
                  <option key={cc.id} value={cc.id}>
                    {cc.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-cat">Categoria</Label>
              <Select id="filter-cat" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="all">Todas</option>
                {payableCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-status">Status</Label>
              <Select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as TransactionStatus | "all")}
              >
                <option value="all">Todos</option>
                {(Object.keys(STATUS_LABEL) as TransactionStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <CostCenterChart data={totals} />

          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-2 font-medium">Centro de custo</th>
                  <th className="px-4 py-2 font-medium">Total de despesas</th>
                </tr>
              </thead>
              <tbody>
                {totals.map((t) => (
                  <tr key={t.costCenterId ?? "none"} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-2 text-slate-700">{t.name}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{formatCurrency(t.total)}</td>
                  </tr>
                ))}
                {totals.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-slate-400">
                      Nenhuma despesa no período/filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar centro de custo" : "Novo centro de custo"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cc-name">Nome</Label>
            <Input id="cc-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cc-description">Descrição</Label>
            <Input id="cc-description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativo
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
