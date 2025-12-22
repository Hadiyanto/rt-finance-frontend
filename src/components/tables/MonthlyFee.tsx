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

  const sumNumber = (
    rows: BreakdownRow[],
    key: keyof BreakdownRow
  ): number =>
    rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0);

  const totalKasRT = sumNumber(safeData, "kasRT");
  const totalAgamaRT = sumNumber(safeData, "agamaRT");
  const totalSampah = sumNumber(safeData, "sampah");
  const totalKeamanan = sumNumber(safeData, "keamanan");
  const totalAgamaRW = sumNumber(safeData, "agamaRW");
  const totalKasRW = sumNumber(safeData, "kasRW");
  const totalKkmRW = sumNumber(safeData, "kkmRW");

  const totalKasRtPlusAgamaRt = totalKasRT + totalAgamaRT;
  const totalKeamananPlusRw =
    totalKeamanan + totalAgamaRW + totalKasRW;

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

    // 🔹 TOTAL PER POS IURAN
    const totalPerPosRow = [
      "TOTAL PER POS IURAN",
      "",
      "",
      totalKasRT,
      totalAgamaRT,
      totalSampah,
      totalKeamanan,
      totalAgamaRW,
      totalKasRW,
      totalKkmRW,
    ];

    // 🔹 REKAP TOTAL IURAN
    const rekapTotalRow = [
      "REKAP TOTAL IURAN",
      "",
      "",
      totalKasRtPlusAgamaRt,
      "",
      totalSampah,
      totalKeamananPlusRw,
      "",
      "",
      totalKkmRW,
    ];

    const csv =
      [header, ...rows, totalPerPosRow, rekapTotalRow]
        .map((row) => row.join(","))
        .join("\n");

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
    doc.text(`Periode: ${month}/${year}`, 14, 18);

    const YELLOW_TOTAL: [number, number, number] = [255, 245, 204];
    const YELLOW_RECAP: [number, number, number] = [255, 239, 186];

    autoTable(doc, {
      startY: 22,
      theme: "grid",
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

      body: [
        // =====================
        // DATA WARGA
        // =====================
        ...safeData.map((r) => [
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

        // =====================
        // TOTAL PER POS IURAN
        // =====================
        [
          { content: "TOTAL PER POS IURAN", colSpan: 3, styles: { halign: "left" } },
          totalKasRT,
          totalAgamaRT,
          totalSampah,
          totalKeamanan,
          totalAgamaRW,
          totalKasRW,
          totalKkmRW,
        ],

        // =====================
        // REKAP TOTAL IURAN (MERGE)
        // =====================
        [
          { content: "REKAP TOTAL IURAN", colSpan: 3, styles: { halign: "left" } },

          // KAS RT + AGAMA RT
          {
            content: totalKasRtPlusAgamaRt.toLocaleString("id-ID"),
            colSpan: 2,
            styles: { halign: "center" },
          },

          // SAMPAH
          totalSampah.toLocaleString("id-ID"),

          // KEAMANAN + AGAMA RW + KAS RW
          {
            content: totalKeamananPlusRw.toLocaleString("id-ID"),
            colSpan: 3,
            styles: { halign: "center" },
          },

          // KKM-RW
          totalKkmRW.toLocaleString("id-ID"),
        ],
      ],

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [240, 240, 240],
        textColor: 20,
        fontStyle: "bold",
      },

      didParseCell: (hookData) => {
        const totalRowIndex = safeData.length;
        const recapRowIndex = safeData.length + 1;

        // TOTAL PER POS
        if (hookData.row.index === totalRowIndex) {
          hookData.cell.styles.fillColor = YELLOW_TOTAL;
          hookData.cell.styles.fontStyle = "bold";
        }

        // REKAP TOTAL
        if (hookData.row.index === recapRowIndex) {
          hookData.cell.styles.fillColor = YELLOW_RECAP;
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });

    doc.save(`laporan-iuran-${year}-${month}.pdf`);
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

              {/* TOTAL ROW */}
              <TableRow className="bg-gray-100 font-semibold dark:bg-white/[0.06] text-center border-t-2 border-b-1 border-black">
                <TableCell colSpan={3} className="px-5 py-4 border-black">TOTAL PER POS IURAN</TableCell>
                {/* <TableCell className="px-5 py-4"> </TableCell>
                <TableCell className="px-5 py-4"> </TableCell> */}
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalKasRT.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalAgamaRT.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalSampah.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalKeamanan.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalAgamaRW.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4 border-1 border-black">
                  {totalKasRW.toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="px-5 py-4">
                  {totalKkmRW.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>

              <TableRow className={`bg-gray-100 font-semibold dark:bg-white/[0.06] font-bold text-center border-b-1 border-black`}>
                {/* KAS RT + AGAMA RT */}
                <TableCell colSpan={3} className="px-5 py-4">REKAP TOTAL IURAN</TableCell>
                {/* <TableCell className="px-5 py-4"> </TableCell>
                <TableCell className="px-5 py-4"> </TableCell> */}
                <TableCell colSpan={2} className={`bg-gray-100 font-semibold dark:bg-white/[0.06] text-lg border-1 border-black`}>
                  {totalKasRtPlusAgamaRt.toLocaleString("id-ID")}
                </TableCell>

                {/* SAMPAH */}
                <TableCell className={`bg-gray-100 font-semibold dark:bg-white/[0.06] text-lg border-1 border-black`}>
                  {totalSampah.toLocaleString("id-ID")}
                </TableCell>

                {/* KEAMANAN + AGAMA RW + KAS RW */}
                <TableCell colSpan={3} className={`bg-gray-100 font-semibold dark:bg-white/[0.06] text-lg border-1 border-black`}>
                  {totalKeamananPlusRw.toLocaleString("id-ID")}
                </TableCell>

                {/* KKM-RW */}
                <TableCell className={`bg-gray-100 font-semibold dark:bg-white/[0.06] text-lg`}>
                  {totalKkmRW.toLocaleString("id-ID")}
                </TableCell>
              </TableRow>
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
