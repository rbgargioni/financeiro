/** Adds N months to an ISO date, clamping the day to the target month's last day (e.g. Jan 31 + 1 month -> Feb 28). */
export function addMonthsClamped(iso: string, months: number): string {
  const date = new Date(iso);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes(), date.getSeconds());
  const lastDayOfTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDayOfTargetMonth));
  return target.toISOString();
}

export function generateRecurringDueDates(startIso: string, occurrences: number): string[] {
  return Array.from({ length: occurrences }, (_, i) => (i === 0 ? startIso : addMonthsClamped(startIso, i)));
}
