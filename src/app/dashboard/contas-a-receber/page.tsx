"use client";

import { TransactionsPage } from "@/components/transactions/TransactionsPage";

export default function ContasAReceberPage() {
  return (
    <TransactionsPage
      type="receivable"
      title="Contas a Receber"
      description="Acompanhe os valores que sua empresa vai receber de clientes."
    />
  );
}
