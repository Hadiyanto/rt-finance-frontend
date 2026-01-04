"use client";

import { useEffect, useState } from "react";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import PendingSubmissionTable from "@/components/tables/PendingSubmissionTable";
import SubmitToRWModal from "@/components/modals/SubmitToRWModal";
import { useTokenAutoCheck } from "@/hooks/useTokenAutoCheck";

interface SubmissionRecord {
    id: number;
    block: string;
    houseNumber: string;
    fullName: string;
    period: string;
    amount: number;
    isLate: boolean;
}

interface Summary {
    totalRecords: number;
    totalAmount: number;
    onTime: { count: number; amount: number };
    late: { count: number; amount: number };
}

interface PendingResponse {
    submissionPeriod: string;
    summary: Summary;
    onTimeRecords: SubmissionRecord[];
    lateRecords: SubmissionRecord[];
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function PendingSubmissionPage() {
    useTokenAutoCheck();

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [data, setData] = useState<PendingResponse | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedOnTimeIds, setSelectedOnTimeIds] = useState<number[]>([]);
    const [selectedLateIds, setSelectedLateIds] = useState<number[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const years = [currentYear - 1, currentYear, currentYear + 1];

    useEffect(() => {
        async function loadPending() {
            try {
                setLoading(true);
                setSelectedOnTimeIds([]);
                setSelectedLateIds([]);

                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/pending-submission?year=${year}&month=${month}`
                );

                const json: PendingResponse = await res.json();
                setData(json);
            } catch (err) {
                console.error("Failed to fetch pending submissions:", err);
                setData(null);
            } finally {
                setLoading(false);
            }
        }

        loadPending();
    }, [year, month]);

    const allSelectedIds = [...selectedOnTimeIds, ...selectedLateIds];

    const selectedTotalAmount = allSelectedIds.reduce((sum, id) => {
        const record =
            data?.onTimeRecords.find((r) => r.id === id) ||
            data?.lateRecords.find((r) => r.id === id);
        return sum + (record?.amount ?? 0);
    }, 0);

    const handleSubmit = async (period: string, notes: string) => {
        if (allSelectedIds.length === 0) return;

        try {
            setIsSubmitting(true);

            const token = localStorage.getItem("token");
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/submit-to-rw`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        ids: allSelectedIds,
                        period,
                        notes,
                    }),
                }
            );

            if (!res.ok) {
                throw new Error("Failed to submit");
            }

            // Refresh data
            setIsModalOpen(false);
            setSelectedOnTimeIds([]);
            setSelectedLateIds([]);

            // Re-fetch data
            const refreshRes = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/monthly-fee/pending-submission?year=${year}&month=${month}`
            );
            const refreshJson: PendingResponse = await refreshRes.json();
            setData(refreshJson);

            alert("Submit berhasil!");
        } catch (err) {
            console.error("Submit failed:", err);
            alert("Submit gagal. Silakan coba lagi.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <PageBreadcrumb pageTitle="Pending Submission" />

            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">Period:</span>
                    <select
                        value={month}
                        onChange={(e) => setMonth(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {Array.from({ length: 12 }).map((_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {String(i + 1).padStart(2, "0")}
                            </option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700"
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>
                                {y}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SUMMARY */}
            {data && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500">Total Records</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {data.summary.totalRecords}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-500">Total Amount</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {formatCurrency(data.summary.totalAmount)}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-green-200 dark:border-green-700">
                        <div className="text-sm text-green-600">On Time</div>
                        <div className="text-2xl font-bold text-green-600">
                            {data.summary.onTime.count}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-red-200 dark:border-red-700">
                        <div className="text-sm text-red-600">Late</div>
                        <div className="text-2xl font-bold text-red-600">
                            {data.summary.late.count}
                        </div>
                    </div>
                </div>
            )}

            {/* TABLES */}
            {loading ? (
                <p>Loading...</p>
            ) : data ? (
                <div className="space-y-8">
                    <PendingSubmissionTable
                        title="On Time Records"
                        records={data.onTimeRecords}
                        selectedIds={selectedOnTimeIds}
                        onSelectionChange={setSelectedOnTimeIds}
                        badgeColor="success"
                    />

                    <PendingSubmissionTable
                        title="Late Records"
                        records={data.lateRecords}
                        selectedIds={selectedLateIds}
                        onSelectionChange={setSelectedLateIds}
                        badgeColor="error"
                    />
                </div>
            ) : (
                <p className="text-gray-500">No data available</p>
            )}

            {/* NEXT BUTTON */}
            {allSelectedIds.length > 0 && (
                <div className="fixed bottom-6 right-6">
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-full shadow-lg hover:bg-brand-600 transition"
                    >
                        <span>Next</span>
                        <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
                            {allSelectedIds.length} selected
                        </span>
                    </button>
                </div>
            )}

            {/* MODAL */}
            <SubmitToRWModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                selectedCount={allSelectedIds.length}
                totalAmount={selectedTotalAmount}
                isSubmitting={isSubmitting}
            />
        </div>
    );
}
