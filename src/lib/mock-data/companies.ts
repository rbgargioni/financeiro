import { Company } from "@/lib/types";
import { daysFromNow } from "./dates";

export const companies: Company[] = [
  {
    id: "company-paonosso",
    name: "Padaria Pão Nosso",
    cnpj: "12.345.678/0001-90",
    segment: "Alimentação",
    planId: "plan-starter",
    subscriptionStatus: "trialing",
    trialEndsAt: daysFromNow(5),
    createdAt: daysFromNow(-2),
  },
  {
    id: "company-rotacerta",
    name: "Oficina Mecânica Rota Certa",
    cnpj: "23.456.789/0001-01",
    segment: "Serviços Automotivos",
    planId: "plan-profissional",
    subscriptionStatus: "active",
    trialEndsAt: daysFromNow(-25),
    createdAt: daysFromNow(-90),
  },
  {
    id: "company-boavista",
    name: "Distribuidora Boa Vista",
    cnpj: "34.567.890/0001-12",
    segment: "Distribuição",
    planId: "plan-starter",
    subscriptionStatus: "expired",
    trialEndsAt: daysFromNow(-10),
    createdAt: daysFromNow(-17),
  },
];
