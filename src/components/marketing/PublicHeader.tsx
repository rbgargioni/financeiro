import Link from "next/link";
import { Wallet2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet2 size={18} />
          </div>
          <span className="text-lg font-semibold text-slate-900">Fluxa</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#modulos" className="hover:text-slate-900">Recursos</a>
          <a href="#segmentos" className="hover:text-slate-900">Segmentos</a>
          <a href="#planos" className="hover:text-slate-900">Planos</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
            Entrar
          </Link>
          <Link href="/signup">
            <Button size="sm">Teste grátis por 7 dias</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
