import { Plan } from "@/lib/types";

export const plans: Plan[] = [
  {
    id: "plan-starter",
    name: "Starter",
    priceMonthly: 49.9,
    maxUsers: 2,
    maxTransactionsPerMonth: 100,
    features: [
      "Contas a pagar e a receber",
      "Fluxo de caixa",
      "Categorias e contatos ilimitados",
      "1 usuário adicional",
    ],
  },
  {
    id: "plan-profissional",
    name: "Profissional",
    priceMonthly: 99.9,
    maxUsers: 5,
    maxTransactionsPerMonth: 500,
    features: [
      "Tudo do Starter",
      "Relatórios avançados",
      "Até 5 usuários",
      "Suporte prioritário",
    ],
  },
  {
    id: "plan-empresarial",
    name: "Empresarial",
    priceMonthly: 199.9,
    maxUsers: 20,
    maxTransactionsPerMonth: 5000,
    features: [
      "Tudo do Profissional",
      "Usuários ilimitados",
      "Múltiplas filiais",
      "Gerente de conta dedicado",
    ],
  },
];
