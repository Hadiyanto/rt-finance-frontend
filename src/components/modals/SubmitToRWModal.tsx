"use client";

import React from "react";

interface SubmitToRWModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (period: string, notes: string) => void;
    selectedCount: number;
    totalAmount: number;
    isSubmitting: boolean;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function SubmitToRWModal({
    isOpen,
    onClose,
    onSubmit,
    selectedCount,
    totalAmount,
    isSubmitting,
}: SubmitToRWModalProps) {
    const today = new Date();
    const [month, setMonth] = React.useState(today.getMonth() + 1);
    const [year, setYear] = React.useState(today.getFullYear());
    const [notes, setNotes] = React.useState("");

    const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const period = `${year}-${String(month).padStart(2, "0")}`;
        onSubmit(period, notes);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Submit ke RW
                </h2>

                {/* Summary */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                    <div className="flex justify-between mb-2">
                        <span className="text-gray-500 dark:text-gray-400">Jumlah Record:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{selectedCount}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Total Amount:</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Period */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Period Setoran
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={month}
                                onChange={(e) => setMonth(Number(e.target.value))}
                                className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            >
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <option key={i + 1} value={i + 1}>
                                        {new Date(2000, i, 1).toLocaleString("id-ID", { month: "long" })}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={year}
                                onChange={(e) => setYear(Number(e.target.value))}
                                className="border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Notes
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g., Setoran Januari"
                            rows={3}
                            className="w-full border rounded-lg px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition disabled:opacity-50"
                        >
                            {isSubmitting ? "Submitting..." : "Submit"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
