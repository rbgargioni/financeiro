import { ArrowDownCircle, ArrowUpCircle, Wallet, Tags, Users2, BarChart3 } from "lucide-react";

const features = [
  {
    icon: ArrowDownCircle,
    title: "Contas a Receber",
    description: "Registre vendas e serviços, acompanhe vencimentos e receba com previsibilidade.",
  },
  {
    icon: ArrowUpCircle,
    title: "Contas a Pagar",
    description: "Controle fornecedores, salários, impostos e nunca mais perca um vencimento.",
  },
  {
    icon: Wallet,
    title: "Fluxo de Caixa",
    description: "Veja entradas e saídas em tempo real e projete o caixa das próximas semanas.",
  },
  {
    icon: Tags,
    title: "Categorias personalizadas",
    description: "Organize receitas e despesas do jeito que faz sentido para o seu negócio.",
  },
  {
    icon: Users2,
    title: "Clientes e Fornecedores",
    description: "Um cadastro central para relacionar todos os seus lançamentos financeiros.",
  },
  {
    icon: BarChart3,
    title: "Relatórios e dashboard",
    description: "Indicadores claros de saldo, atrasos e projeção para decidir com confiança.",
  },
];

export function Features() {
  return (
    <section id="modulos" className="mx-auto max-w-6xl px-4 py-20 md:px-8">
      <div className="max-w-xl">
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
          Tudo que o financeiro da sua empresa precisa
        </h2>
        <p className="mt-3 text-slate-600">
          Módulos pensados para o dia a dia de quem vende, paga contas e precisa fechar o mês no azul.
        </p>
      </div>
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <feature.icon size={20} />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{feature.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
