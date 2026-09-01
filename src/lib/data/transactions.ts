import { getStore, mutateStore, delay } from "./store";
import { Transaction } from "../types";

export async function listTransactions(companyId: string): Promise<Transaction[]> {
  return delay(
    getStore()
      .transactions.filter((t) => t.companyId === companyId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  );
}

export async function createTransaction(input: Omit<Transaction, "id">): Promise<Transaction> {
  const tx: Transaction = { ...input, id: `tx-${Date.now()}-${Math.round(Math.random() * 1000)}` };
  mutateStore((store) => {
    store.transactions.push(tx);
  });
  return delay(tx);
}

export async function markTransactionPaid(id: string): Promise<void> {
  mutateStore((store) => {
    const tx = store.transactions.find((t) => t.id === id);
    if (tx) {
      tx.status = "paid";
      tx.paidAt = new Date().toISOString();
    }
  });
  return delay(undefined);
}

export async function deleteTransaction(id: string): Promise<void> {
  mutateStore((store) => {
    store.transactions = store.transactions.filter((t) => t.id !== id);
  });
  return delay(undefined);
}
