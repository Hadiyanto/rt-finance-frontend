"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PaymentHistoryTable from "@/components/tables/PaymentHistoryTable";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

interface HistoryItem {
    period: string;
    status: "COMPLETED" | "NOT_PAID" | "WAITING_APPROVAL" | "PENDING";
}

interface Resident {
    block: string;
    houseNumber: string;
    fullName: string;
    history: HistoryItem[];
}

interface HistoryResponse {
    range: string;
    totalResidents: number;
    data: Resident[];
}

function generatePeriods(startYear: number, startMonth: number, endYear: number, endMonth: number): string[] {
    const periods: string[] = [];
    let year = startYear;
    let month = startMonth;

    while (year < endYear || (year === endYear && month <= endMonth)) {
        periods.push(`${year}-${String(month).padStart(2, "0")}`);
        month++;
        if (month > 12) {
            month = 1;
            year++;
        }
    }

    return periods;
}

export default function PaymentHistoryPage() {
    useTokenAutoCheck();

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Default: last 3 months
    const defaultStartMonth = currentMonth - 2 > 0 ? currentMonth - 2 : currentMonth - 2 + 12;
    const defaultStartYear = currentMonth - 2 > 0 ? currentYear : currentYear - 1;

    const [startYear, setStartYear] = useState(defaultStartYear);
    const [startMonth, setStartMonth] = useState(defaultStartMonth);
    const [endYear, setEndYear] = useState(currentYear);
    const [endMonth, setEndMonth] = useState(currentMonth);
    const [block, setBlock] = useState("");
    const [data, setData] = useState<Resident[]>([]);
    const [loading, setLoading] = useState(true);

    // Generate year options: current year - 1, current year, current year + 1
    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        async function loadHistory() {
            try {
                setLoading(true);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/history?startYear=${startYear}&startMonth=${startMonth}&endYear=${endYear}&endMonth=${endMonth}`
                );

                const json: HistoryResponse = await res.json();
                setData(json.data ?? []);
            } catch (err) {
                console.error("Failed to fetch payment history:", err);
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        loadHistory();
    }, [startYear, startMonth, endYear, endMonth]);

    const filteredData = block ? data.filter((item) => item.block === block) : data;
    const periods = generatePeriods(startYear, startMonth, endYear, endMonth);

    // Get unique blocks for filter
    const blocks = [...new Set(data.map((item) => item.block))].sort();

    return (
        <div className="p-6 space-y-6">
            <PageBreadcrumb pageTitle="Payment History" />

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-4">
                {/* Start Period */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Dari:</span>
                    <select
                        value={startMonth}
                        onChange={(e) => setStartMonth(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {String(i + 1).padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                    <select
                        value={startYear}
                        onChange={(e) => setStartYear(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                {/* End Period */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Sampai:</span>
                    <select
                        value={endMonth}
                        onChange={(e) => setEndMonth(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {String(i + 1).padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                    <select
                        value={endYear}
                        onChange={(e) => setEndYear(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Block Filter */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Block:</span>
                    <select
                        value={block}
                        onChange={(e) => setBlock(e.target.value)}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        <option value="">All Blocks</option>
                        {blocks.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SUMMARY */}
            <div className="text-sm text-gray-500">
                Total: <span className="font-semibold text-gray-900 dark:text-white">{filteredData.length}</span> residents
            </div>

            {/* TABLE */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <PaymentHistoryTable data={filteredData} periods={periods} />
            )}
        </div>
    );
}
