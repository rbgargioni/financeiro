"use client";

import { TransactionsPage } from "@/components/transactions/TransactionsPage";

export default function ContasAPagarPage() {
  return (
    <TransactionsPage
      type="payable"
      title="Contas a Pagar"
      description="Controle os pagamentos e obrigações da sua empresa."
    />
  );
}
