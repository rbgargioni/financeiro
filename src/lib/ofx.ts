export interface OfxTransaction {
  id: string;
  date: string; // ISO date
  amount: number; // signed: positive = credit (entrada), negative = debit (saída)
  description: string;
}

function extractTag(block: string, tag: string): string | null {
  // OFX (v1/SGML) tags are often unclosed, one per line — so a tag's value is
  // whatever follows it up to the next '<' or line break, not a matched pair.
  const match = block.match(new RegExp(`<${tag}>\\s*([^\r\n<]*)`, "i"));
  return match ? match[1].trim() : null;
}

function parseOfxDate(raw: string): string {
  const year = raw.slice(0, 4);
  const month = raw.slice(4, 6);
  const day = raw.slice(6, 8);
  return new Date(`${year}-${month}-${day}T12:00:00`).toISOString();
}

/**
 * Lenient OFX parser: real-world OFX from Brazilian banks is SGML, not XML —
 * tags routinely go unclosed — so this splits on <STMTTRN> markers instead of
 * doing a strict XML parse.
 */
export function parseOfx(content: string): OfxTransaction[] {
  const blocks = content.split(/<STMTTRN>/i).slice(1);
  const transactions: OfxTransaction[] = [];

  blocks.forEach((raw, index) => {
    const block = raw.split(/<\/STMTTRN>/i)[0];
    const dtposted = extractTag(block, "DTPOSTED");
    const trnamt = extractTag(block, "TRNAMT");
    const memo = extractTag(block, "MEMO");
    const name = extractTag(block, "NAME");
    const fitid = extractTag(block, "FITID");

    if (!dtposted || !trnamt) return;
    const amount = parseFloat(trnamt.replace(",", "."));
    if (Number.isNaN(amount)) return;

    transactions.push({
      id: fitid || `ofx-${index}`,
      date: parseOfxDate(dtposted),
      amount,
      description: (memo || name || "Lançamento importado").trim(),
    });
  });

  return transactions;
}
