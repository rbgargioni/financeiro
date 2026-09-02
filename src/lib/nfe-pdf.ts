import * as pdfjsLib from "pdfjs-dist";
import { ParsedNfe } from "./nfe";
import { InvoiceTaxes } from "./types";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

function parseBRNumber(raw: string): number {
  const value = parseFloat(raw.replace(/\./g, "").replace(",", "."));
  return Number.isNaN(value) ? 0 : value;
}

function findAccessKey(text: string): string {
  const nearLabel = text.match(/CHAVE DE ACESSO[\s\S]{0,30}?([\d\s]{40,80})/i);
  const searchIn = [nearLabel?.[1], text].filter((v): v is string => Boolean(v));
  for (const candidate of searchIn) {
    const runs = candidate.match(/(?:\d[ \t]?){40,60}/g) ?? [];
    for (const run of runs) {
      const digits = run.replace(/\D/g, "");
      if (digits.length >= 44 && digits.length <= 50) return digits;
    }
  }
  return "";
}

/**
 * Looks for a money amount near a label, e.g. "Valor Líquido da NFS-e ... R$ 4.378,40". The
 * window between label and value is generous (layouts insert extra words/line breaks there),
 * but requiring the "R$" marker right before the digits keeps it from matching an unrelated
 * amount further down the page, and from mistaking a "-" (not applicable) placeholder for zero.
 */
function findValue(text: string, labels: string[]): number {
  for (const label of labels) {
    const match = text.match(new RegExp(`${label}[\\s\\S]{0,40}?R\\$\\s*([\\d.]+,\\d{2})`, "i"));
    if (match) return parseBRNumber(match[1]);
  }
  return 0;
}

/** Prefers a date+time pair (the actual emission timestamp) over a bare date. */
function findDate(text: string): string {
  const withTime = text.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (withTime) {
    const [, day, month, year, hour, min, sec] = withTime;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(min), Number(sec)).toISOString();
  }
  const dateOnly = text.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (dateOnly) {
    const [, day, month, year] = dateOnly;
    return new Date(Number(year), Number(month) - 1, Number(day), 12, 0, 0).toISOString();
  }
  return new Date().toISOString();
}

/** Only matches CNPJs printed with punctuation (XX.XXX.XXX/XXXX-XX) — an unformatted 14-digit
 *  run is too easy to confuse with a chunk of the (unformatted) access key. */
function findCnpjs(text: string): string[] {
  const matches = text.match(/\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g) ?? [];
  const seen = new Set<string>();
  for (const m of matches) seen.add(m.replace(/\D/g, ""));
  return Array.from(seen);
}

/** DANFE/DANFSe print "Nome/Razão Social" (or "Nome / Nome Empresarial") right before the
 *  party's name, followed by an "E-mail"/"Endereço" field — first match is the issuer, second
 *  the recipient. Best-effort: returns [] if the layout doesn't use this wording. */
function findPartyNames(text: string): string[] {
  const re = /Nome\s*\/\s*(?:Nome Empresarial|Raz[ãa]o Social)([\s\S]{1,120}?)(?:E-mail|Endere[çc]o|CNPJ)/gi;
  const names: string[] = [];
  for (const match of text.matchAll(re)) {
    const name = match[1].replace(/\s+/g, " ").trim();
    if (name) names.push(name);
  }
  return names;
}

/**
 * NF-e modelo 55/65 access keys encode their own número/série:
 * cUF(2) AAMM(4) CNPJ(14) mod(2) serie(3) nNF(9) tpEmis(1) cNF(8) cDV(1) = 44 digits.
 * Decoding this is more reliable than reading "Nº"/"Série" off the PDF layout. NFS-e nacional
 * keys are a different length/shape, so for those we fall back to the "Número da NFS-e" label.
 */
function decodeNFeKeyParts(accessKey: string): { series: string; number: string } | null {
  if (accessKey.length !== 44) return null;
  return {
    series: String(parseInt(accessKey.slice(22, 25), 10)),
    number: String(parseInt(accessKey.slice(25, 34), 10)),
  };
}

function findNfseNumber(text: string): string {
  return text.match(/N[uú]mero da NFS-e[\s\S]{0,15}?(\d+)/i)?.[1] ?? "";
}

/**
 * Best-effort extraction from a DANFE/DANFSe PDF: reliable for the access key (and, for NF-e,
 * the número/série decoded from it) and for the total value and party names, all printed with
 * fairly predictable labels on the standard national layout. Per-tax values depend more on the
 * document's own layout and may come up empty — the caller should flag rows from this parser as
 * needing a closer look before saving.
 */
export async function parseNfePdf(file: File): Promise<ParsedNfe> {
  const text = await extractText(file);
  const accessKey = findAccessKey(text);
  if (!accessKey) {
    throw new Error(
      "Não encontrei a chave de acesso nesse PDF — confirme se é o DANFE/DANFSe de uma nota fiscal."
    );
  }

  const keyParts = decodeNFeKeyParts(accessKey);
  const totalValue = findValue(text, [
    "Valor L[íi]quido da NFS-?e",
    "VALOR TOTAL DA NOTA",
    "VALOR TOTAL DA NF-?E(?!S)",
    "Valor do Servi[çc]o",
    "VALOR TOTAL",
  ]);
  const [issuerCnpj = "", recipientCnpj = ""] = findCnpjs(text);
  const [issuerName = "", recipientName = ""] = findPartyNames(text);

  const taxes: InvoiceTaxes = {
    icms: findValue(text, ["VALOR DO ICMS"]),
    ipi: findValue(text, ["VALOR DO IPI"]),
    pis: findValue(text, ["VALOR DO PIS"]),
    cofins: findValue(text, ["VALOR DA COFINS", "VALOR DO COFINS"]),
    iss: findValue(text, ["VALOR DO ISS(?:QN)?", "ISSQN Apurado"]),
  };

  return {
    accessKey,
    number: keyParts?.number ?? findNfseNumber(text),
    series: keyParts?.series ?? "",
    issueDate: findDate(text),
    issuerCnpj,
    issuerName,
    recipientCnpj,
    recipientName,
    productsValue: totalValue,
    discountValue: 0,
    freightValue: 0,
    taxes,
    totalValue,
    items: [
      {
        code: "",
        description: `Importado de PDF (${file.name}) — confira os dados`,
        quantity: 1,
        unitValue: totalValue,
        totalValue,
      },
    ],
  };
}
