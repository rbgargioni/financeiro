import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,0.35),_transparent_55%)]" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl">
          <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300 ring-1 ring-inset ring-indigo-400/30">
            Feito para pequenas e médias empresas
          </span>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-white md:text-5xl">
            O financeiro que conecta gestão e resultado
          </h1>
          <p className="mt-5 text-lg text-slate-300">
            Contas a pagar, contas a receber e fluxo de caixa em um só lugar. Tenha controle total do
            dinheiro da sua empresa, sem planilhas.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Comece seu teste grátis de 7 dias
                <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full border-slate-600 bg-transparent text-white hover:bg-white/10 sm:w-auto">
                Já tenho conta
              </Button>
            </Link>
          </div>
          <ul className="mt-8 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:gap-6">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-indigo-400" />
              Sem cartão de crédito
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-indigo-400" />
              Configuração em minutos
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-indigo-400" />
              Cancele quando quiser
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
