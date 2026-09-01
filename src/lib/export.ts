import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface ExportColumn {
  header: string;
  key: string;
}

export type ExportRow = Record<string, string | number>;

export function exportToExcel(filename: string, columns: ExportColumn[], rows: ExportRow[]) {
  const data = rows.map((row) => {
    const obj: ExportRow = {};
    for (const col of columns) obj[col.header] = row[col.key] ?? "";
    return obj;
  });
  const worksheet = XLSX.utils.json_to_sheet(data, { header: columns.map((c) => c.header) });
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPdf(filename: string, title: string, columns: ExportColumn[], rows: ExportRow[]) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(`Gerado em ${new Date().toLocaleDateString("pt-BR")}`, 14, 22);

  autoTable(doc, {
    startY: 28,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => String(row[c.key] ?? ""))),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [79, 70, 229] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`${filename}.pdf`);
}
