"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listUsersByCompany, createUser } from "@/lib/data/users";
import { AppUser, UserRole } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input, Label, Select } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { plans } from "@/lib/mock-data/plans";

const ROLE_LABEL: Record<UserRole, string> = {
  super_admin: "Super Admin",
  owner: "Proprietário",
  admin: "Administrador",
  member: "Colaborador",
};

export default function UsuariosPage() {
  const { company, user } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    if (!company) return;
    const list = await listUsersByCompany(company.id);
    setUsers(list);
    setLoading(false);
  }

  useEffect(() => {
    setLoading(true);
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company]);

  const plan = plans.find((p) => p.id === company?.planId);
  const canAddMore = !plan || users.length < plan.maxUsers;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!company) return;
    setError(null);
    try {
      await createUser({ companyId: company.id, name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("member");
      setModalOpen(false);
      await reload();
    } catch {
      setError("Não foi possível adicionar este usuário.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Usuários</h1>
          <p className="text-sm text-slate-500">
            Gerencie quem tem acesso à conta da {company?.name}. Plano atual permite até {plan?.maxUsers ?? "—"} usuários.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} disabled={!canAddMore}>
          <Plus size={16} />
          Novo usuário
        </Button>
      </div>

      {!canAddMore && (
        <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Você atingiu o limite de usuários do seu plano atual. Faça upgrade em Configurações para adicionar mais pessoas.
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-400">
              <th className="px-5 py-3 font-medium">Nome</th>
              <th className="px-5 py-3 font-medium">E-mail</th>
              <th className="px-5 py-3 font-medium">Papel</th>
            </tr>
          </thead>
          <tbody>
            {!loading &&
              users.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 text-slate-800">
                    {u.name} {u.id === user?.id && <span className="text-xs text-slate-400">(você)</span>}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone={u.role === "owner" ? "indigo" : "slate"}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Novo usuário">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user-name">Nome</Label>
            <Input id="user-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-email">E-mail</Label>
            <Input id="user-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="user-password">Senha provisória</Label>
            <Input
              id="user-password"
              type="text"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="user-role">Papel</Label>
            <Select id="user-role" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="member">Colaborador</option>
              <option value="admin">Administrador</option>
            </Select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit">Adicionar</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
