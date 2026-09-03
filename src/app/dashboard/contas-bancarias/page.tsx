"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listBankAccounts, createBankAccount, updateBankAccount, deleteBankAccount } from "@/lib/data/bank-accounts";
import { fetchBanks, BankOption } from "@/lib/banks";
import { BankAccount } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { ExportColumn } from "@/lib/export";

export default function ContasBancariasPage() {
  const { company } = useAuth();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [name, setName] = useState("");
  const [bank, setBank] = useState("");
  const [agency, setAgency] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [active, setActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bankOptions, setBankOptions] = useState<BankOption[]>([]);

  async function reload() {
    if (!company) return;
    const list = await listBankAccounts(company.id);
    setAccounts(list);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    reload();
    fetchBanks().then(setBankOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  function openCreateModal() {
    setEditing(null);
    setName("");
    setBank("");
    setAgency("");
    setAccountNumber("");
    setActive(true);
    setModalOpen(true);
  }

  function openEditModal(account: BankAccount) {
    setEditing(account);
    setName(account.name);
    setBank(account.bank);
    setAgency(account.agency);
    setAccountNumber(account.accountNumber);
    setActive(account.active);
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      if (editing) {
        await updateBankAccount(editing.id, { name, bank, agency, accountNumber, active });
      } else {
        await createBankAccount({ companyId: company.id, name, bank, agency, accountNumber, active });
      }
      setModalOpen(false);
      await reload();
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(account: BankAccount) {
    await updateBankAccount(account.id, { active: !account.active });
    await reload();
  }

  async function handleDelete(id: string) {
    await deleteBankAccount(id);
    await reload();
  }

  const exportColumns: ExportColumn[] = [
    { header: "Nome", key: "name" },
    { header: "Banco", key: "bank" },
    { header: "Agência", key: "agency" },
    { header: "Conta", key: "accountNumber" },
    { header: "Status", key: "status" },
  ];
  const exportRows = useMemo(
    () =>
      accounts.map((a) => ({
        name: a.name,
        bank: a.bank,
        agency: a.agency,
        accountNumber: a.accountNumber,
        status: a.active ? "Ativa" : "Inativa",
      })),
    [accounts]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Contas Bancárias</h1>
          <p className="text-sm text-slate-500">Cadastre as contas bancárias da empresa para associar aos lançamentos.</p>
        </div>
        <div className="flex gap-2">
          <ExportMenu filename="contas-bancarias" title="Contas Bancárias" columns={exportColumns} rows={exportRows} />
          <Button onClick={openCreateModal}>
            <Plus size={16} />
            Nova conta bancária
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
                  <th className="px-5 py-3 font-medium">Banco</th>
                  <th className="px-5 py-3 font-medium">Agência</th>
                  <th className="px-5 py-3 font-medium">Conta</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!loading &&
                  accounts.map((a) => (
                    <tr key={a.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-slate-800">{a.name}</td>
                      <td className="px-5 py-3 text-slate-500">{a.bank || "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{a.agency || "—"}</td>
                      <td className="px-5 py-3 text-slate-500">{a.accountNumber || "—"}</td>
                      <td className="px-5 py-3">
                        <button onClick={() => toggleActive(a)}>
                          <Badge tone={a.active ? "green" : "slate"}>{a.active ? "Ativa" : "Inativa"}</Badge>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(a)}
                            title="Editar"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(a.id)}
                            title="Excluir"
                            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {!loading && accounts.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                      Nenhuma conta bancária cadastrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Editar conta bancária" : "Nova conta bancária"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ba-name">Nome</Label>
            <Input
              id="ba-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Banrisul - Conta Corrente"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ba-bank">Banco</Label>
              <Input
                id="ba-bank"
                list="bank-options"
                autoComplete="off"
                value={bank}
                onChange={(e) => setBank(e.target.value)}
                placeholder="Comece a digitar..."
              />
              <datalist id="bank-options">
                {bankOptions.map((b) => (
                  <option key={b.code} value={b.name} />
                ))}
              </datalist>
            </div>
            <div>
              <Label htmlFor="ba-agency">Agência</Label>
              <Input id="ba-agency" value={agency} onChange={(e) => setAgency(e.target.value)} />
            </div>
          </div>
          <div>
            <Label htmlFor="ba-account">Número da conta</Label>
            <Input id="ba-account" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Ativa
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
