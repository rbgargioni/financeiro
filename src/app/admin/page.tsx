"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { listCompanies } from "@/lib/data/companies";
import { createCompanyAsAdmin } from "@/lib/data/auth";
import { Company } from "@/lib/types";
import { plans } from "@/lib/mock-data/plans";
import { getEffectiveStatus, daysRemaining, STATUS_LABELS } from "@/lib/trial";
import { formatDate } from "@/lib/utils";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";

const SEGMENTS = [
  "Alimentação",
  "Serviços Automotivos",
  "Distribuição",
  "Vestuário",
  "Construção Civil",
  "Serviços",
  "Outros",
];

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  async function reload() {
    const cs = await listCompanies();
    setCompanies(cs);
    setLoading(false);
  }

  useEffect(() => {
    reload();
  }, []);

  const stats = useMemo(() => {
    const statuses = companies.map((c) => getEffectiveStatus(c));
    return {
      total: companies.length,
      trialing: statuses.filter((s) => s === "trialing").length,
      active: statuses.filter((s) => s === "active").length,
      expired: statuses.filter((s) => s === "expired" || s === "canceled").length,
    };
  }, [companies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Empresas clientes</h1>
          <p className="text-sm text-slate-500">Gerencie todas as empresas que usam o Fluxa.</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={16} />
          Nova empresa
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total de empresas" value={stats.total} />
        <StatCard label="Em teste grátis" value={stats.trialing} />
        <StatCard label="Assinaturas ativas" value={stats.active} />
        <StatCard label="Expiradas/canceladas" value={stats.expired} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Empresa</th>
              <th className="px-5 py-3 font-medium">Segmento</th>
              <th className="px-5 py-3 font-medium">Plano</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Cliente desde</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              companies.map((company) => {
                const status = getEffectiveStatus(company);
                const plan = plans.find((p) => p.id === company.planId);
                return (
                  <tr key={company.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/empresas?id=${company.id}`}
                        className="flex items-center gap-2 font-medium text-slate-800 hover:text-indigo-600"
                      >
                        <Building2 size={15} className="text-slate-400" />
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{company.segment}</td>
                    <td className="px-5 py-3 text-slate-500">{plan?.name ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={status === "active" ? "green" : status === "trialing" ? "yellow" : "red"}>
                        {STATUS_LABELS[status]}
                        {status === "trialing" ? ` · ${daysRemaining(company)}d` : ""}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(company.createdAt)}</td>
                  </tr>
                );
              })}
            {!loading && companies.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                  Nenhuma empresa cadastrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <NewCompanyModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={reload} />
    </div>
  );
}

function NewCompanyModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [segment, setSegment] = useState(SEGMENTS[0]);
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setCompanyName("");
    setCnpj("");
    setSegment(SEGMENTS[0]);
    setOwnerName("");
    setEmail("");
    setPassword("");
    setError(null);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createCompanyAsAdmin({ companyName, cnpj, segment, ownerName, email, password });
      reset();
      onClose();
      await onCreated();
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nova empresa"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="admin-company-name">Nome da empresa</Label>
          <Input id="admin-company-name" required value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="admin-cnpj">CNPJ</Label>
            <Input id="admin-cnpj" required value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
          </div>
          <div>
            <Label htmlFor="admin-segment">Segmento</Label>
            <Select id="admin-segment" value={segment} onChange={(e) => setSegment(e.target.value)}>
              {SEGMENTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="admin-owner-name">Nome do responsável</Label>
          <Input id="admin-owner-name" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="admin-owner-email">E-mail do responsável</Label>
          <Input id="admin-owner-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="admin-owner-password">Senha provisória</Label>
          <Input
            id="admin-owner-password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-400">Compartilhe essa senha com o cliente — ele pode trocá-la depois.</p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Criando..." : "Criar empresa"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-2xl font-semibold text-slate-900">{value}</p>
      </CardContent>
    </Card>
  );
}
