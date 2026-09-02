"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Upload, CheckCircle2, FileUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listCategories } from "@/lib/data/categories";
import { listContacts } from "@/lib/data/contacts";
import { listCostCenters } from "@/lib/data/cost-centers";
import { createTransaction } from "@/lib/data/transactions";
import { Category, Contact, CostCenter, TransactionType } from "@/lib/types";
import { parseOfx, OfxTransaction } from "@/lib/ofx";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";

interface ReviewRow {
  ofx: OfxTransaction;
  include: boolean;
  type: TransactionType;
  categoryId: string;
  contactId: string;
  costCenterId: string;
}

export default function ImportarExtratoPage() {
  const { company } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!company) return;
    Promise.all([listCategories(company.id), listContacts(company.id), listCostCenters(company.id)]).then(
      ([cats, cts, ccs]) => {
        setCategories(cats);
        setContacts(cts);
        setCostCenters(ccs);
      }
    );
  }, [company]);

  const receivableCategories = categories.filter((c) => c.type === "receivable");
  const payableCategories = categories.filter((c) => c.type === "payable");
  const clientContacts = contacts.filter((c) => c.type === "client");
  const supplierContacts = contacts.filter((c) => c.type === "supplier");
  const activeCostCenters = costCenters.filter((cc) => cc.active);

  const setupIncomplete =
    receivableCategories.length === 0 ||
    payableCategories.length === 0 ||
    clientContacts.length === 0 ||
    supplierContacts.length === 0 ||
    activeCostCenters.length === 0;

  function defaultCategoryId(type: TransactionType) {
    return (type === "receivable" ? receivableCategories[0] : payableCategories[0])?.id ?? "";
  }
  function defaultContactId(type: TransactionType) {
    return (type === "receivable" ? clientContacts[0] : supplierContacts[0])?.id ?? "";
  }
  function defaultCostCenterId(type: TransactionType) {
    return type === "payable" ? activeCostCenters[0]?.id ?? "" : "";
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setImportedCount(null);
    setFileName(file.name);
    try {
      const content = await file.text();
      const parsed = parseOfx(content);
      if (parsed.length === 0) {
        setError("Não encontrei nenhum lançamento nesse arquivo. Confirme se é um extrato no formato OFX.");
        setRows([]);
        return;
      }
      setRows(
        parsed.map((ofx) => {
          const type: TransactionType = ofx.amount >= 0 ? "receivable" : "payable";
          return {
            ofx,
            include: true,
            type,
            categoryId: defaultCategoryId(type),
            contactId: defaultContactId(type),
            costCenterId: defaultCostCenterId(type),
          };
        })
      );
    } catch {
      setError("Não foi possível ler esse arquivo. Confirme se é um extrato .ofx válido.");
      setRows([]);
    }
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function toggleAll(include: boolean) {
    setRows((prev) => prev.map((row) => ({ ...row, include })));
  }

  const includedCount = useMemo(() => rows.filter((r) => r.include).length, [rows]);

  async function handleConfirm() {
    if (!company) return;
    setImporting(true);
    setError(null);
    try {
      const toImport = rows.filter((r) => r.include);
      for (const row of toImport) {
        await createTransaction({
          companyId: company.id,
          type: row.type,
          description: row.ofx.description,
          amount: Math.abs(row.ofx.amount),
          dueDate: row.ofx.date,
          paidAt: row.ofx.date,
          status: "paid",
          categoryId: row.categoryId,
          contactId: row.contactId,
          costCenterId: row.costCenterId || null,
        });
      }
      setImportedCount(toImport.length);
      setRows([]);
      setFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setError("Algo deu errado ao salvar os lançamentos. Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Importar Extrato</h1>
        <p className="text-sm text-slate-500">
          Envie o extrato bancário (.ofx) para lançar as movimentações como contas a pagar e a receber já pagas.
        </p>
      </div>

      {setupIncomplete && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Antes de importar, cadastre pelo menos uma categoria de receita e de despesa (em Categorias), um cliente e
          um fornecedor (em Clientes e Fornecedores) e um centro de custo ativo (em Centros de Custo) — eles são
          usados para classificar os lançamentos importados.
        </p>
      )}

      {importedCount !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {importedCount} lançamento(s) importado(s) com sucesso.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Selecionar arquivo</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
            <Upload size={24} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              {fileName ? fileName : "Clique para escolher o arquivo .ofx do seu banco"}
            </span>
            <span className="text-xs text-slate-400">Formato OFX (Open Financial Exchange)</span>
            <input ref={fileInputRef} type="file" accept=".ofx" className="hidden" onChange={handleFileChange} disabled={setupIncomplete} />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Conferir lançamentos ({includedCount} de {rows.length} selecionados)</CardTitle>
            <div className="flex gap-2">
              <button onClick={() => toggleAll(true)} className="text-xs font-medium text-indigo-600 hover:underline">
                Selecionar todos
              </button>
              <button onClick={() => toggleAll(false)} className="text-xs font-medium text-slate-500 hover:underline">
                Desmarcar todos
              </button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <th className="px-4 py-3 font-medium"></th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Descrição</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Categoria</th>
                    <th className="px-4 py-3 font-medium">Centro de Custo</th>
                    <th className="px-4 py-3 font-medium">{"Cliente/Fornecedor"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const rowCategories = row.type === "receivable" ? receivableCategories : payableCategories;
                    const rowContacts = row.type === "receivable" ? clientContacts : supplierContacts;
                    return (
                      <tr key={row.ofx.id} className={`border-b border-slate-50 last:border-0 ${!row.include ? "opacity-40" : ""}`}>
                        <td className="px-4 py-2">
                          <input
                            type="checkbox"
                            checked={row.include}
                            onChange={(e) => updateRow(index, { include: e.target.checked })}
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(row.ofx.date)}</td>
                        <td className="px-4 py-2 text-slate-800">{row.ofx.description}</td>
                        <td className={row.type === "receivable" ? "px-4 py-2 whitespace-nowrap text-emerald-600" : "px-4 py-2 whitespace-nowrap text-red-600"}>
                          {row.type === "receivable" ? "+" : "-"} {formatCurrency(Math.abs(row.ofx.amount))}
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            className="min-w-[9rem]"
                            value={row.categoryId}
                            disabled={!row.include}
                            onChange={(e) => updateRow(index, { categoryId: e.target.value })}
                          >
                            {rowCategories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-4 py-2">
                          {row.type === "payable" ? (
                            <Select
                              className="min-w-[9rem]"
                              value={row.costCenterId}
                              disabled={!row.include}
                              onChange={(e) => updateRow(index, { costCenterId: e.target.value })}
                            >
                              {activeCostCenters.map((cc) => (
                                <option key={cc.id} value={cc.id}>
                                  {cc.name}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <Select
                            className="min-w-[9rem]"
                            value={row.contactId}
                            disabled={!row.include}
                            onChange={(e) => updateRow(index, { contactId: e.target.value })}
                          >
                            {rowContacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {rows.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleConfirm} disabled={importing || includedCount === 0}>
            <FileUp size={16} />
            {importing ? "Importando..." : `Confirmar importação (${includedCount})`}
          </Button>
        </div>
      )}
    </div>
  );
}
