import { CostCenter, Transaction } from "./types";

export interface FinancialSummary {
  balance: number;
  receivablePending: number;
  payablePending: number;
  overdueCount: number;
  overdueAmount: number;
}

export function computeSummary(transactions: Transaction[]): FinancialSummary {
  let balance = 0;
  let receivablePending = 0;
  let payablePending = 0;
  let overdueCount = 0;
  let overdueAmount = 0;

  for (const tx of transactions) {
    if (tx.status === "paid") {
      balance += tx.type === "receivable" ? tx.amount : -tx.amount;
      continue;
    }
    if (tx.type === "receivable") {
      receivablePending += tx.amount;
    } else {
      payablePending += tx.amount;
    }
    if (tx.status === "overdue") {
      overdueCount += 1;
      overdueAmount += tx.amount;
    }
  }

  return { balance, receivablePending, payablePending, overdueCount, overdueAmount };
}

export interface WeeklyBucket {
  label: string;
  entradas: number;
  saidas: number;
}

const BUCKET_LABELS = [
  "3 sem. atrás",
  "2 sem. atrás",
  "Semana passada",
  "Esta semana",
  "Próxima semana",
  "Em 2 semanas",
];

export function buildWeeklyCashFlow(transactions: Transaction[]): WeeklyBucket[] {
  const buckets: WeeklyBucket[] = BUCKET_LABELS.map((label) => ({ label, entradas: 0, saidas: 0 }));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const tx of transactions) {
    const due = new Date(tx.dueDate);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const bucketIndex = Math.floor(diffDays / 7) + 3;
    if (bucketIndex < 0 || bucketIndex >= buckets.length) continue;
    if (tx.type === "receivable") {
      buckets[bucketIndex].entradas += tx.amount;
    } else {
      buckets[bucketIndex].saidas += tx.amount;
    }
  }

  return buckets;
}

export interface CostCenterTotal {
  costCenterId: string | null;
  name: string;
  total: number;
}

/** Sums payable (despesa) amounts by cost center. Apply period/category/status filters to
 *  `transactions` before calling this — it only knows how to group and sum. */
export function groupPayablesByCostCenter(transactions: Transaction[], costCenters: CostCenter[]): CostCenterTotal[] {
  const totals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "payable") continue;
    const key = tx.costCenterId ?? "";
    totals.set(key, (totals.get(key) ?? 0) + tx.amount);
  }

  const results: CostCenterTotal[] = [];
  for (const cc of costCenters) {
    const total = totals.get(cc.id);
    if (total) results.push({ costCenterId: cc.id, name: cc.name, total });
  }
  const unassigned = totals.get("");
  if (unassigned) results.push({ costCenterId: null, name: "Sem centro de custo", total: unassigned });

  return results.sort((a, b) => b.total - a.total);
}
