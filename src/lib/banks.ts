export interface BankOption {
  code: number;
  name: string;
}

interface BrasilApiBank {
  code: number | null;
  name: string;
  fullName: string | null;
}

let cache: BankOption[] | null = null;

/**
 * Fetches the official list of Brazilian banks (Bacen COMPE codes) from BrasilAPI — a free,
 * public mirror of Banco Central data, no key needed. Cached in memory for the session; on
 * failure (offline, API down) returns an empty list so the "Banco" field just falls back to
 * plain free text instead of breaking the form.
 */
export async function fetchBanks(): Promise<BankOption[]> {
  if (cache) return cache;
  try {
    const res = await fetch("https://brasilapi.com.br/api/banks/v1");
    if (!res.ok) return [];
    const data: BrasilApiBank[] = await res.json();
    cache = data
      .filter((b) => b.code !== null && (b.fullName || b.name))
      .map((b) => ({ code: b.code as number, name: b.fullName || b.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return cache;
  } catch {
    return [];
  }
}
