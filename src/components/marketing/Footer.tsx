import Link from "next/link";
import { Wallet2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 md:flex-row md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Wallet2 size={16} />
          </div>
          <span className="font-semibold text-slate-900">Fluxa</span>
        </Link>
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} Fluxa. Todos os direitos reservados.</p>
        <div className="flex items-center gap-4 text-sm text-slate-500">
          <Link href="/login" className="hover:text-slate-800">Entrar</Link>
          <Link href="/signup" className="hover:text-slate-800">Teste grátis</Link>
        </div>
      </div>
    </footer>
  );
}
