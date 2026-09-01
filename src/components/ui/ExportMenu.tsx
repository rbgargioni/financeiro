"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { Button } from "./Button";
import { exportToExcel, exportToPdf, ExportColumn, ExportRow } from "@/lib/export";

interface ExportMenuProps {
  filename: string;
  title: string;
  columns: ExportColumn[];
  rows: ExportRow[];
}

export function ExportMenu({ filename, title, columns, rows }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <Button type="button" variant="outline" onClick={() => setOpen((o) => !o)} disabled={rows.length === 0}>
        <Download size={16} />
        Exportar
        <ChevronDown size={14} />
      </Button>
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              exportToExcel(filename, columns, rows);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileSpreadsheet size={15} className="text-emerald-600" />
            Excel (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => {
              exportToPdf(filename, title, columns, rows);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <FileText size={15} className="text-red-600" />
            PDF
          </button>
        </div>
      )}
    </div>
  );
}
