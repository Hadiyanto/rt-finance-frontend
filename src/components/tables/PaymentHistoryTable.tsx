"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";

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

interface PaymentHistoryTableProps {
    data: Resident[];
    periods: string[];
}

function getStatusIcon(status: string) {
    switch (status) {
        case "COMPLETED":
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600" title="Lunas">
                    ✓
                </span>
            );
        case "NOT_PAID":
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600" title="Belum Bayar">
                    ✗
                </span>
            );
        case "WAITING_APPROVAL":
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600" title="Menunggu Approval">
                    ⏳
                </span>
            );
        case "PENDING":
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600" title="Pending">
                    ⏸
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-400" title="Unknown">
                    -
                </span>
            );
    }
}

function formatPeriod(period: string): string {
    const [year, month] = period.split("-");
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    return `${monthNames[monthIndex]} ${year}`;
}

export default function PaymentHistoryTable({ data, periods }: PaymentHistoryTableProps) {
    const safeData = Array.isArray(data) ? data : [];

    return (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
                <div className="min-w-[900px]">
                    <Table>
                        {/* HEADER */}
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    Block
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    No
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    Nama
                                </TableCell>
                                {periods.map((period) => (
                                    <TableCell key={period} isHeader className="px-5 py-3 text-gray-500 text-center">
                                        {formatPeriod(period)}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHeader>

                        {/* BODY */}
                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {safeData.map((item, idx) => (
                                <TableRow key={`${item.block}-${item.houseNumber}-${idx}`}>
                                    <TableCell className="px-5 py-4 font-medium">{item.block}</TableCell>
                                    <TableCell className="px-5 py-4">{item.houseNumber}</TableCell>
                                    <TableCell className="px-5 py-4">{item.fullName}</TableCell>
                                    {periods.map((period) => {
                                        const historyItem = item.history.find((h) => h.period === period);
                                        const status = historyItem?.status ?? "UNKNOWN";
                                        return (
                                            <TableCell key={period} className="px-5 py-4 text-center">
                                                {getStatusIcon(status)}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* LEGEND */}
            <div className="flex items-center gap-6 px-5 py-4 border-t border-gray-100 dark:border-white/[0.05] text-sm text-gray-500">
                <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs">✓</span>
                    Lunas
                </span>
                <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs">✗</span>
                    Belum Bayar
                </span>
                <span className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 text-xs">⏳</span>
                    Menunggu Approval
                </span>
            </div>
        </div>
    );
}
