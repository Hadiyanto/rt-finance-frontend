"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface BreakdownRow {
  block: string;
  houseNumber: string;
  fullName: string;
  kasRT: number | null;
  agamaRT: number | null;
  sampah: number | null;
  keamanan: number | null;
  agamaRW: number | null;
  kasRW: number | null;
  kkmRW: number | null;
}

interface Props {
  data: BreakdownRow[];
  year: string;
  month: string;
}

/* ======================
 * HELPERS
 * ====================== */
const toTitleCase = (value: string) =>
  value
    ? value
      .toLowerCase()
      .split(" ")
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
    : "";

const formatNumber = (value: number | null) =>
  value ? value.toLocaleString("id-ID") : null;

/* ======================
 * COMPONENT
 * ====================== */
export default function MonthlyFeeBreakdownTable({
  data,
  year,
  month,
}: Props) {
  const safeData = Array.isArray(data) ? data : [];

  /* ======================
   * CSV DOWNLOAD
   * ====================== */
  const downloadCSV = () => {
    const header = [
      "Block",
      "House No",
      "Full Name",
      "KAS RT",
      "AGAMA RT",
      "SAMPAH",
      "KEAMANAN",
      "AGAMA RW",
      "KAS RW",
      "KKM-RW",
    ];

    const rows = safeData.map((r) => [
      r.block,
      r.houseNumber,
      toTitleCase(r.fullName),
      r.kasRT ?? "",
      r.agamaRT ?? "",
      r.sampah ?? "",
      r.keamanan ?? "",
      r.agamaRW ?? "",
      r.kasRW ?? "",
      r.kkmRW ?? "",
    ]);

    const csv =
      [header, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `monthly-fee-breakdown-${year}-${month}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  };

  /* ======================
   * PDF DOWNLOAD
   * ====================== */
  const downloadPDF = () => {
    const doc = new jsPDF("l", "mm", "a4");

    doc.setFontSize(14);
    doc.text("Laporan Iuran Graha Mampang Mas RT 001", 14, 12);

    doc.setFontSize(10);
    doc.text(`Period: ${month}/${year}`, 14, 18);

    autoTable(doc, {
      startY: 22,
      head: [[
        "Block",
        "No",
        "Name",
        "KAS RT",
        "AGAMA RT",
        "SAMPAH",
        "KEAMANAN",
        "AGAMA RW",
        "KAS RW",
        "KKM-RW",
      ]],
      body: safeData.map((r) => [
        r.block,
        r.houseNumber,
        toTitleCase(r.fullName),
        r.kasRT ?? "-",
        r.agamaRT ?? "-",
        r.sampah ?? "-",
        r.keamanan ?? "-",
        r.agamaRW ?? "-",
        r.kasRW ?? "-",
        r.kkmRW ?? "-",
      ]),
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 20,
      },
      alternateRowStyles: {
        fillColor: [250, 250, 250],
      },
      theme: "grid",
    });

    doc.save(`monthly-fee-breakdown-${year}-${month}.pdf`);
  };

  /* ======================
   * RENDER
   * ====================== */
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-white/[0.05]">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Breakdown Iuran Bulanan
        </h3>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.1] dark:text-gray-200 dark:hover:bg-white/[0.05]"
          >
            📄 CSV
          </button>

          <button
            onClick={downloadPDF}
            className="inline-flex items-center gap-2 rounded-lg border border-blue-600 px-3 py-1.5 text-sm font-medium text-blue-600 transition hover:bg-blue-50 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-500/10"
          >
            📑 PDF
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="max-w-full overflow-x-auto max-h-[70vh]">
        <div className="min-w-[1200px]">
          <Table>
            {/* TABLE HEADER */}
            <TableHeader className="sticky top-0 z-10 border-b border-gray-200 bg-gray-100 dark:border-white/[0.08] dark:bg-[#111827]">
              <TableRow>
                {[
                  "Block",
                  "House No",
                  "Full Name",
                  "KAS RT",
                  "AGAMA RT",
                  "SAMPAH",
                  "KEAMANAN",
                  "AGAMA RW",
                  "KAS RW",
                  "KKM-RW",
                ].map((label) => (
                  <TableCell
                    key={label}
                    isHeader
                    className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-300"
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            {/* TABLE BODY */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {safeData.map((item, idx) => (
                <TableRow
                  key={idx}
                  className={`
                    ${idx % 2 === 0
                      ? "bg-white dark:bg-transparent"
                      : "bg-gray-50 dark:bg-white/[0.02]"}
                    hover:bg-blue-50/40 dark:hover:bg-blue-500/5
                  `}
                >
                  <TableCell className="px-5 py-4">{item.block}</TableCell>
                  <TableCell className="px-5 py-4">{item.houseNumber}</TableCell>
                  <TableCell className="px-5 py-4 font-medium">
                    {toTitleCase(item.fullName)}
                  </TableCell>

                  {[
                    item.kasRT,
                    item.agamaRT,
                    item.sampah,
                    item.keamanan,
                    item.agamaRW,
                    item.kasRW,
                    item.kkmRW,
                  ].map((val, i) => (
                    <TableCell key={i} className="px-5 py-4">
                      {formatNumber(val) ? (
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {formatNumber(val)}
                        </span>
                      ) : (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                          –
                        </span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {safeData.length === 0 && (
                <TableRow>
                  {Array.from({ length: 10 }).map((_, i) => (
                    <TableCell
                      key={i}
                      className="px-5 py-6 text-center text-sm text-gray-500"
                    >
                      {i === 0 ? "No data available" : ""}
                    </TableCell>
                  ))}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
