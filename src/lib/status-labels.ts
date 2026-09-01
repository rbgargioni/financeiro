import { TransactionStatus } from "./types";

export const STATUS_LABEL: Record<TransactionStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
};

export const STATUS_TONE: Record<TransactionStatus, "green" | "yellow" | "red"> = {
  pending: "yellow",
  paid: "green",
  overdue: "red",
};
