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

function text(root: Element | Document | null, tag: string): string {
  return root?.querySelector(tag)?.textContent?.trim() ?? "";
}

function num(root: Element | Document | null, tag: string): number {
  const raw = text(root, tag).replace(",", ".");
  const value = parseFloat(raw);
  return Number.isNaN(value) ? 0 : value;
}

/**
 * Parses a NF-e (modelo 55/65) XML file, as downloaded from the SEFAZ portal or an emitter
 * system. Unlike OFX (SGML, often malformed), NF-e XML is well-formed, so this uses DOMParser
 * instead of regex. querySelector matches by local tag name, which works here even though the
 * document declares the `http://www.portalfiscal.inf.br/nfe` namespace — browsers ignore XML
 * namespaces for plain (non `ns|tag`) CSS selectors.
 */
export function parseNfeXml(content: string): ParsedNfe {
  const doc = new DOMParser().parseFromString(content, "application/xml");
  if (doc.querySelector("parsererror")) {
    throw new Error("Arquivo XML inválido ou corrompido.");
  }

  const infNFe = doc.querySelector("infNFe");
  if (!infNFe) {
    throw new Error("Esse arquivo não parece ser o XML de uma NF-e.");
  }

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
