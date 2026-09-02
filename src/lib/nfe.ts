import { InvoiceItem, InvoiceTaxes } from "./types";

export interface ParsedNfe {
  accessKey: string;
  number: string;
  series: string;
  issueDate: string; // ISO date
  issuerCnpj: string;
  issuerName: string;
  recipientCnpj: string;
  recipientName: string;
  productsValue: number;
  discountValue: number;
  freightValue: number;
  taxes: InvoiceTaxes;
  totalValue: number;
  items: InvoiceItem[];
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCnpj(digits: string): string {
  if (digits.length !== 14) return digits;
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function text(root: Element | Document | null, tag: string): string {
  return root?.querySelector(tag)?.textContent?.trim() ?? "";
}

function num(root: Element | Document | null, tag: string): number {
  const raw = text(root, tag).replace(",", ".");
  const value = parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}

/** NF-e (modelo 55/65, mercadorias) — namespace `http://www.portalfiscal.inf.br/nfe`. */
function parseNFeProdutos(infNFe: Element): ParsedNfe {
  const idAttr = infNFe.getAttribute("Id") ?? "";
  const accessKey = onlyDigits(idAttr);
  if (accessKey.length !== 44) {
    throw new Error("Não encontrei uma chave de acesso válida nesse XML.");
  }

  const ide = infNFe.querySelector("ide");
  const emit = infNFe.querySelector("emit");
  const dest = infNFe.querySelector("dest");
  const icmsTot = infNFe.querySelector("total > ICMSTot");
  const issqnTot = infNFe.querySelector("total > ISSQNtot");

  const issueDateRaw = text(ide, "dhEmi") || text(ide, "dEmi");
  const issueDate = issueDateRaw ? new Date(issueDateRaw).toISOString() : new Date().toISOString();

  const items: InvoiceItem[] = Array.from(infNFe.querySelectorAll("det")).map((det) => {
    const prod = det.querySelector("prod");
    return {
      code: text(prod, "cProd"),
      description: text(prod, "xProd"),
      quantity: num(prod, "qCom"),
      unitValue: num(prod, "vUnCom"),
      totalValue: num(prod, "vProd"),
    };
  });

  return {
    accessKey,
    number: text(ide, "nNF"),
    series: text(ide, "serie"),
    issueDate,
    issuerCnpj: onlyDigits(text(emit, "CNPJ")),
    issuerName: text(emit, "xNome"),
    recipientCnpj: onlyDigits(text(dest, "CNPJ") || text(dest, "CPF")),
    recipientName: text(dest, "xNome"),
    productsValue: num(icmsTot, "vProd"),
    discountValue: num(icmsTot, "vDesc"),
    freightValue: num(icmsTot, "vFrete"),
    taxes: {
      icms: num(icmsTot, "vICMS"),
      ipi: num(icmsTot, "vIPI"),
      pis: num(icmsTot, "vPIS"),
      cofins: num(icmsTot, "vCOFINS"),
      iss: num(issqnTot, "vISS"),
    },
    totalValue: num(icmsTot, "vNF"),
    items,
  };
}

/** NFS-e nacional (serviços) — namespace `http://www.sped.fazenda.gov.br/nfse`. */
function parseNFSe(infNFSe: Element): ParsedNfe {
  const accessKey = onlyDigits(infNFSe.getAttribute("Id") ?? "");
  if (!accessKey) {
    throw new Error("Não encontrei uma chave de acesso válida nesse XML.");
  }

  const emit = infNFSe.querySelector("emit");
  const infDPS = infNFSe.querySelector("DPS > infDPS") ?? infNFSe.querySelector("infDPS");
  const toma = infDPS?.querySelector("toma") ?? null;

  const issueDateRaw = text(infDPS, "dhEmi") || text(infNFSe, "dhProc");
  const issueDate = issueDateRaw ? new Date(issueDateRaw).toISOString() : new Date().toISOString();

  const serviceValue = num(infDPS, "valores > vServPrest > vServ") || num(infNFSe, "valores > vLiq");
  const description =
    text(infDPS, "serv > cServ > xDescServ").replace(/\s+/g, " ").trim() || "Serviço prestado";

  return {
    accessKey,
    number: text(infNFSe, "nNFSe"),
    series: "",
    issueDate,
    issuerCnpj: onlyDigits(text(emit, "CNPJ")),
    issuerName: text(emit, "xNome"),
    recipientCnpj: onlyDigits(text(toma, "CNPJ") || text(toma, "CPF")),
    recipientName: text(toma, "xNome"),
    productsValue: serviceValue,
    discountValue: 0,
    freightValue: 0,
    taxes: {
      icms: 0,
      ipi: 0,
      pis: 0,
      cofins: 0,
      iss: num(infDPS, "valores > vISSQN"),
    },
    totalValue: serviceValue,
    items: [{ code: "", description, quantity: 1, unitValue: serviceValue, totalValue: serviceValue }],
  };
}

/**
 * Parses a NF-e (modelo 55/65, mercadorias) or NFS-e nacional (serviços) XML file, as
 * downloaded from the SEFAZ/prefeitura portal or an emitter system. Unlike OFX (SGML, often
 * malformed), these are well-formed XML, so this uses DOMParser instead of regex.
 * querySelector matches by local tag name, which works here even though both documents declare
 * an XML namespace — browsers ignore XML namespaces for plain (non `ns|tag`) CSS selectors.
 */
export function parseNfeXml(content: string): ParsedNfe {
  const doc = new DOMParser().parseFromString(content, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Arquivo XML inválido ou corrompido.");
  }

  const infNFe = doc.querySelector("infNFe");
  if (infNFe) return parseNFeProdutos(infNFe);

  const infNFSe = doc.querySelector("infNFSe");
  if (infNFSe) return parseNFSe(infNFSe);

  throw new Error("Esse arquivo não parece ser o XML de uma NF-e ou NFS-e.");
}
