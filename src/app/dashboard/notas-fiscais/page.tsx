"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { Upload, FileUp, CheckCircle2, Eye, Trash2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listInvoices, createInvoice, deleteInvoice } from "@/lib/data/invoices";
import { Invoice, InvoiceDirection, InvoiceTaxes } from "@/lib/types";
import { parseNfeXml, onlyDigits, formatCnpj, ParsedNfe } from "@/lib/nfe";
import { parseNfePdf } from "@/lib/nfe-pdf";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";

interface ReviewRow {
  key: string;
  fileName: string;
  source: "xml" | "pdf";
  parsed: ParsedNfe | null;
  error: string | null;
  duplicate: boolean;
  include: boolean;
  direction: InvoiceDirection;
}

function counterpartyLabel(name: string, cnpj: string): string {
  return name || (cnpj ? formatCnpj(cnpj) : "—");
}

const TABS: { value: InvoiceDirection; label: string }[] = [
  { value: "issued", label: "Emitidas" },
  { value: "received", label: "Recebidas" },
];

const TAX_LABELS: Record<keyof InvoiceTaxes, string> = {
  icms: "ICMS",
  ipi: "IPI",
  pis: "PIS",
  cofins: "COFINS",
  iss: "ISS",
};

function taxTotal(taxes: InvoiceTaxes): number {
  return taxes.icms + taxes.ipi + taxes.pis + taxes.cofins + taxes.iss;
}

export default function NotasFiscaisPage() {
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<InvoiceDirection>("issued");
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [detailsInvoice, setDetailsInvoice] = useState<Invoice | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function reload() {
    if (!company) return;
    const list = await listInvoices(company.id);
    setInvoices(list);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setError(null);
    setImportedCount(null);

    const companyDigits = onlyDigits(company?.cnpj ?? "");
    const existingKeys = new Set(invoices.map((i) => i.accessKey));
    const newRows: ReviewRow[] = [];

    for (const file of Array.from(files)) {
      const isPdf = file.name.toLowerCase().endsWith(".pdf");
      try {
        const parsed = isPdf ? await parseNfePdf(file) : parseNfeXml(await file.text());
        const duplicate = existingKeys.has(parsed.accessKey) || newRows.some((r) => r.parsed?.accessKey === parsed.accessKey);
        const direction: InvoiceDirection =
          companyDigits && parsed.issuerCnpj === companyDigits ? "issued" : "received";
        newRows.push({
          key: parsed.accessKey,
          fileName: file.name,
          source: isPdf ? "pdf" : "xml",
          parsed,
          error: null,
          duplicate,
          include: !duplicate,
          direction,
        });
      } catch (err) {
        newRows.push({
          key: file.name,
          fileName: file.name,
          source: isPdf ? "pdf" : "xml",
          parsed: null,
          error: err instanceof Error ? err.message : "Não foi possível ler esse arquivo.",
          duplicate: false,
          include: false,
          direction: "received",
        });
      }
    }

    setRows(newRows);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function updateRow(index: number, patch: Partial<ReviewRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  const includedCount = useMemo(() => rows.filter((r) => r.include).length, [rows]);

  async function handleConfirm() {
    if (!company) return;
    setImporting(true);
    setError(null);
    try {
      const toImport = rows.filter((r) => r.include && r.parsed);
      for (const row of toImport) {
        const parsed = row.parsed!;
        await createInvoice({
          companyId: company.id,
          direction: row.direction,
          accessKey: parsed.accessKey,
          number: parsed.number,
          series: parsed.series,
          issueDate: parsed.issueDate,
          issuerCnpj: parsed.issuerCnpj,
          issuerName: parsed.issuerName,
          recipientCnpj: parsed.recipientCnpj,
          recipientName: parsed.recipientName,
          productsValue: parsed.productsValue,
          discountValue: parsed.discountValue,
          freightValue: parsed.freightValue,
          taxes: parsed.taxes,
          totalValue: parsed.totalValue,
          items: parsed.items,
          importedAt: new Date().toISOString(),
        });
      }
      setImportedCount(toImport.length);
      setRows([]);
      await reload();
    } catch {
      setError("Algo deu errado ao salvar as notas. Tente novamente.");
    } finally {
      setImporting(false);
    }
  }

  async function handleDelete(id: string) {
    await deleteInvoice(id);
    if (detailsInvoice?.id === id) setDetailsInvoice(null);
    await reload();
  }

  const activeInvoices = useMemo(() => invoices.filter((i) => i.direction === activeTab), [invoices, activeTab]);

  const totals = useMemo(
    () =>
      activeInvoices.reduce(
        (acc, inv) => {
          acc.total += inv.totalValue;
          acc.icms += inv.taxes.icms;
          acc.ipi += inv.taxes.ipi;
          acc.pis += inv.taxes.pis;
          acc.cofins += inv.taxes.cofins;
          acc.iss += inv.taxes.iss;
          return acc;
        },
        { total: 0, icms: 0, ipi: 0, pis: 0, cofins: 0, iss: 0 }
      ),
    [activeInvoices]
  );
  const totalTaxes = totals.icms + totals.ipi + totals.pis + totals.cofins + totals.iss;

  function counterpartyName(invoice: Invoice) {
    return invoice.direction === "issued"
      ? counterpartyLabel(invoice.recipientName, invoice.recipientCnpj)
      : counterpartyLabel(invoice.issuerName, invoice.issuerCnpj);
  }

  const exportColumns: ExportColumn[] = [
    { header: "Número", key: "number" },
    { header: "Data de emissão", key: "issueDate" },
    { header: activeTab === "issued" ? "Destinatário" : "Emitente", key: "counterparty" },
    { header: "Valor total", key: "totalValue" },
    { header: "Impostos", key: "taxes" },
  ];
  const exportRows = useMemo(
    () =>
      activeInvoices.map((inv) => ({
        number: inv.number,
        issueDate: formatDate(inv.issueDate),
        counterparty: counterpartyName(inv),
        totalValue: formatCurrency(inv.totalValue),
        taxes: formatCurrency(taxTotal(inv.taxes)),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeInvoices]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Notas Fiscais</h1>
        <p className="text-sm text-slate-500">
          Importe os XMLs das NF-e (emitidas ou recebidas) para analisar valores, itens e impostos.
        </p>
      </div>

      {importedCount !== null && (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {importedCount} nota(s) importada(s) com sucesso.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Importar XML ou PDF</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-6 py-10 text-center hover:border-indigo-400 hover:bg-indigo-50/40">
            <Upload size={24} className="text-slate-400" />
            <span className="text-sm font-medium text-slate-700">
              Clique para escolher um ou mais arquivos .xml ou .pdf de NF-e/NFS-e
            </span>
            <span className="text-xs text-slate-400">
              Prefira o .xml quando tiver — é mais confiável. O .pdf (DANFE/DANFSe) é lido como alternativa,
              mas confira os valores antes de importar.
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xml,.pdf"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Conferir notas ({includedCount} de {rows.length} selecionadas)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
                    <th className="px-4 py-3 font-medium"></th>
                    <th className="px-4 py-3 font-medium">Arquivo</th>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Contraparte</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Direção</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.key} className={`border-b border-slate-50 last:border-0 ${!row.include ? "opacity-40" : ""}`}>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={row.include}
                          disabled={!row.parsed}
                          onChange={(e) => updateRow(index, { include: e.target.checked })}
                        />
                      </td>
                      <td className="px-4 py-2 text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          {row.fileName}
                          {row.source === "pdf" && (
                            <span
                              title="Extraído de PDF — confira os valores antes de importar"
                              className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700"
                            >
                              <AlertTriangle size={11} />
                              PDF
                            </span>
                          )}
                        </span>
                      </td>
                      {row.parsed ? (
                        <>
                          <td className="px-4 py-2 text-slate-800">{row.parsed.number}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-slate-500">{formatDate(row.parsed.issueDate)}</td>
                          <td className="px-4 py-2 text-slate-800">
                            {row.direction === "issued"
                              ? counterpartyLabel(row.parsed.recipientName, row.parsed.recipientCnpj)
                              : counterpartyLabel(row.parsed.issuerName, row.parsed.issuerCnpj)}
                          </td>
                          <td className="px-4 py-2 whitespace-nowrap font-medium text-slate-800">
                            {formatCurrency(row.parsed.totalValue)}
                          </td>
                          <td className="px-4 py-2">
                            <Select
                              className="min-w-[9rem]"
                              value={row.direction}
                              disabled={!row.include}
                              onChange={(e) => updateRow(index, { direction: e.target.value as InvoiceDirection })}
                            >
                              {TABS.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.label.replace(/s$/, "")}
                                </option>
                              ))}
                            </Select>
                            {row.duplicate && <p className="mt-1 text-xs text-amber-600">Já importada</p>}
                          </td>
                        </>
                      ) : (
                        <td colSpan={5} className="px-4 py-2 text-red-600">
                          {row.error}
                        </td>
                      )}
                    </tr>
                  ))}
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

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.value ? "bg-indigo-600 text-white" : "bg-white text-slate-600 hover:bg-slate-100"
              } border border-slate-200`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <ExportMenu
          filename={activeTab === "issued" ? "notas-fiscais-emitidas" : "notas-fiscais-recebidas"}
          title={activeTab === "issued" ? "Notas Fiscais Emitidas" : "Notas Fiscais Recebidas"}
          columns={exportColumns}
          rows={exportRows}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase text-slate-400">Notas</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{activeInvoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase text-slate-400">Valor total</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totals.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase text-slate-400">Total de impostos</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(totalTaxes)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-xs font-medium uppercase text-slate-400">Impostos por tipo</p>
            <div className="mt-1 space-y-0.5 text-xs text-slate-600">
              {(Object.keys(TAX_LABELS) as (keyof InvoiceTaxes)[]).map((key) => (
                <div key={key} className="flex justify-between gap-3">
                  <span>{TAX_LABELS[key]}</span>
                  <span className="font-medium">{formatCurrency(totals[key])}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Número</th>
              <th className="px-5 py-3 font-medium">Data</th>
              <th className="px-5 py-3 font-medium">{activeTab === "issued" ? "Destinatário" : "Emitente"}</th>
              <th className="px-5 py-3 font-medium">Valor total</th>
              <th className="px-5 py-3 font-medium">Impostos</th>
              <th className="px-5 py-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              activeInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">{inv.number}</td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(inv.issueDate)}</td>
                  <td className="px-5 py-3 text-slate-500">{counterpartyName(inv)}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{formatCurrency(inv.totalValue)}</td>
                  <td className="px-5 py-3 text-slate-500">{formatCurrency(taxTotal(inv.taxes))}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setDetailsInvoice(inv)}
                        title="Ver detalhes"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(inv.id)}
                        title="Excluir"
                        className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!loading && activeInvoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Nenhuma nota {activeTab === "issued" ? "emitida" : "recebida"} importada.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  Carregando...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={detailsInvoice !== null}
        onClose={() => setDetailsInvoice(null)}
        title={detailsInvoice ? `NF-e ${detailsInvoice.number}/${detailsInvoice.series}` : ""}
      >
        {detailsInvoice && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs uppercase text-slate-400">Emitente</p>
                <p className="text-slate-800">
                  {counterpartyLabel(detailsInvoice.issuerName, detailsInvoice.issuerCnpj)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Destinatário</p>
                <p className="text-slate-800">
                  {counterpartyLabel(detailsInvoice.recipientName, detailsInvoice.recipientCnpj)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Data de emissão</p>
                <p className="text-slate-800">{formatDate(detailsInvoice.issueDate)}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-400">Chave de acesso</p>
                <p className="break-all text-slate-800">{detailsInvoice.accessKey}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-400">Itens</p>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-left uppercase text-slate-400">
                      <th className="px-3 py-2 font-medium">Descrição</th>
                      <th className="px-3 py-2 font-medium">Qtd.</th>
                      <th className="px-3 py-2 font-medium">Unitário</th>
                      <th className="px-3 py-2 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsInvoice.items.map((item, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-0">
                        <td className="px-3 py-2 text-slate-700">{item.description}</td>
                        <td className="px-3 py-2 text-slate-500">{item.quantity}</td>
                        <td className="px-3 py-2 text-slate-500">{formatCurrency(item.unitValue)}</td>
                        <td className="px-3 py-2 font-medium text-slate-700">{formatCurrency(item.totalValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium uppercase text-slate-400">Impostos</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {(Object.keys(TAX_LABELS) as (keyof InvoiceTaxes)[]).map((key) => (
                  <div key={key} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-slate-500">{TAX_LABELS[key]}</span>
                    <span className="font-medium text-slate-800">{formatCurrency(detailsInvoice.taxes[key])}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between border-t border-slate-100 pt-3 text-sm">
              <span className="text-slate-500">Desconto: {formatCurrency(detailsInvoice.discountValue)}</span>
              <span className="text-slate-500">Frete: {formatCurrency(detailsInvoice.freightValue)}</span>
              <span className="font-semibold text-slate-900">Total: {formatCurrency(detailsInvoice.totalValue)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
