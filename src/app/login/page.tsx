"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Wallet2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { friendlyAuthError } from "@/lib/auth-errors";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";

const DEMO_ACCOUNTS = [
  { label: "Empresa em teste grátis", email: "contato@paonosso.com.br" },
  { label: "Empresa com assinatura ativa", email: "financeiro@rotacerta.com.br" },
  { label: "Empresa com teste expirado", email: "contato@boavista.com.br" },
];

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("senha123");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await login(email, password);
      router.push(user.role === "super_admin" ? "/admin" : "/dashboard");
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Wallet2 size={20} />
          </div>
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Entrar no Fluxa</h1>
          <p className="mt-1 text-sm text-slate-500">Acesse o painel financeiro da sua empresa.</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com.br"
              />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            Ainda não tem conta?{" "}
            <Link href="/signup" className="font-medium text-indigo-600 hover:underline">
              Teste grátis por 7 dias
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-400">Contas de demonstração</p>
          <ul className="mt-2 space-y-1.5">
            {DEMO_ACCOUNTS.map((account) => (
              <li key={account.email}>
                <button
                  type="button"
                  onClick={() => setEmail(account.email)}
                  className="text-left text-sm text-slate-600 hover:text-indigo-600"
                >
                  <span className="font-medium">{account.label}:</span> {account.email}
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-slate-400">Senha para todas: senha123</p>
        </div>
      </div>
    </div>
  );
}
