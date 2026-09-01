"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { listCompanies } from "@/lib/data/companies";
import { Company } from "@/lib/types";
import { plans } from "@/lib/mock-data/plans";
import { getEffectiveStatus, daysRemaining, STATUS_LABELS } from "@/lib/trial";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listCompanies().then((cs) => {
      setCompanies(cs);
      setLoading(false);
    });
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
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Empresas clientes</h1>
        <p className="text-sm text-slate-500">Gerencie todas as empresas que usam o Fluxa.</p>
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
          </tbody>
        </table>
      </div>
    </div>
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
