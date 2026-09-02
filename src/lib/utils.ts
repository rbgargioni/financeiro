import clsx, { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Converts an <input type="date"> value ("YYYY-MM-DD") to an ISO string.
 * `new Date("YYYY-MM-DD")` parses as UTC midnight, which then renders as the
 * previous day in any timezone behind UTC (e.g. Brazil) — so this builds the
 * date from local components at noon instead, which stays on the intended
 * calendar day everywhere it's later displayed.
 */
export function dateInputToIso(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0).toISOString();
}

/** Today's date as an <input type="date"> value, in local time (not UTC — see dateInputToIso). */
export function todayDateInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Converts an ISO string back to an <input type="date"> value ("YYYY-MM-DD"), in local time. */
export function isoToDateInputValue(iso: string): string {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
