"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MonthlyFeeBreakdownTable from "@/components/tables/MonthlyFee";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

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

export default function MonthlyFeeBreakdownPage() {
  useTokenAutoCheck();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");

  // 👉 YEAR OPTION (current & next year)
  const years = [currentYear, currentYear + 1].map(String);

  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState<BreakdownRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [block, setBlock] = useState<string>(""); // "" = all block

  useEffect(() => {
    async function loadBreakdown() {
      try {

        setLoading(true);

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/breakdown/${year}/${month}`
        );

        const json = await res.json();
        setData(json.data ?? []);
      } catch (err) {
        console.error("Failed to fetch breakdown:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    loadBreakdown();
  }, [year, month]);

  const filteredData = block
    ? data.filter((item) => item.block === block)
    : data;
  return (
    <div className="p-6 space-y-6">
      <PageBreadcrumb pageTitle="Monthly Fee Breakdown" />

      {/* FILTER */}
      <div className="flex items-center gap-4">
        <select
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {Array.from({ length: 12 }).map((_, i) => {
            const m = String(i + 1).padStart(2, "0");
            return (
              <option key={m} value={m}>
                {m}
              </option>
            );
          })}
        </select>

        <select
          value={year}
          onChange={(e) => setYear(e.target.value)}
          className="border rounded px-3 py-2"
        >
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={block}
          onChange={(e) => setBlock(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        >
          <option value="">All Blocks</option>
          <option value="A1">A1</option>
          <option value="A2">A2</option>
          <option value="A3">A3</option>
          <option value="A4">A4</option>
          <option value="B1">B1</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <MonthlyFeeBreakdownTable data={filteredData} year={year} month={month} />
      )}
    </div>
  );
}
