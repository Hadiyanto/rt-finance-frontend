"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import MonthlyFeeBreakdownTable from "@/components/tables/MonthlyFee";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

export default function MonthlyFeeBreakdownPage() {
  useTokenAutoCheck();

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = String(today.getMonth() + 1).padStart(2, "0");

  // 👉 YEAR OPTION (current & next year)
  const years = [currentYear, currentYear + 1].map(String);

  const [year, setYear] = useState(currentYear.toString());
  const [month, setMonth] = useState(currentMonth);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

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
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <MonthlyFeeBreakdownTable data={data} year={year} month={month} />
      )}
    </div>
  );
}
