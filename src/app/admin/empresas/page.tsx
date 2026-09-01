"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCompany, updateCompanyStatus } from "@/lib/data/companies";
import { listUsersByCompany } from "@/lib/data/users";
import { Company, AppUser, SubscriptionStatus } from "@/lib/types";
import { plans } from "@/lib/mock-data/plans";
import { getEffectiveStatus, daysRemaining, STATUS_LABELS } from "@/lib/trial";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FullScreenLoading } from "@/components/ui/FullScreenLoading";

export default function AdminCompanyDetailPage() {
  return (
    <Suspense fallback={<FullScreenLoading />}>
      <CompanyDetail />
    </Suspense>
  );
}

function CompanyDetail() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  async function reload() {
    if (!id) return;
    const [c, u] = await Promise.all([getCompany(id), listUsersByCompany(id)]);
    setCompany(c ?? null);
    setUsers(u);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleStatusChange(status: SubscriptionStatus) {
    if (!id) return;
    setUpdating(true);
    await updateCompanyStatus(id, status);
    await reload();
    setUpdating(false);
  }

  if (loading) return <p className="text-sm text-slate-500">Carregando...</p>;
  if (!company) return <p className="text-sm text-slate-500">Empresa não encontrada.</p>;

  const status = getEffectiveStatus(company);
  const plan = plans.find((p) => p.id === company.planId);

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft size={15} />
        Voltar para empresas
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{company.name}</h1>
          <p className="text-sm text-slate-500">{company.cnpj} · {company.segment}</p>
        </div>
        <Badge tone={status === "active" ? "green" : status === "trialing" ? "yellow" : "red"}>
          {STATUS_LABELS[status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow label="Plano" value={plan?.name ?? "—"} />
            <InfoRow label="Cliente desde" value={formatDate(company.createdAt)} />
            <InfoRow
              label="Trial termina em"
              value={`${formatDate(company.trialEndsAt)}${status === "trialing" ? ` (${daysRemaining(company)}d restantes)` : ""}`}
            />
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" disabled={updating} onClick={() => handleStatusChange("active")}>
                Ativar assinatura
              </Button>
              <Button size="sm" variant="outline" disabled={updating} onClick={() => handleStatusChange("past_due")}>
                Marcar pagamento pendente
              </Button>
              <Button size="sm" variant="danger" disabled={updating} onClick={() => handleStatusChange("canceled")}>
                Cancelar assinatura
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuários da empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-3">
            {users.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-lg px-2 py-2 hover:bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">{u.name}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <Badge tone={u.role === "owner" ? "indigo" : "slate"}>{u.role}</Badge>
              </div>
            ))}
            {users.length === 0 && <p className="px-2 py-4 text-sm text-slate-400">Nenhum usuário cadastrado.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}
