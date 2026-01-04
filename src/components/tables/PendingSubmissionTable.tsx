"use client";

import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "../ui/table";
import Badge from "../ui/badge/Badge";

interface SubmissionRecord {
    id: number;
    block: string;
    houseNumber: string;
    fullName: string;
    period: string;
    amount: number;
    isLate: boolean;
}

interface PendingSubmissionTableProps {
    title: string;
    records: SubmissionRecord[];
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    badgeColor: "success" | "error";
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(amount);
}

export default function PendingSubmissionTable({
    title,
    records,
    selectedIds,
    onSelectionChange,
    badgeColor,
}: PendingSubmissionTableProps) {
    const safeRecords = Array.isArray(records) ? records : [];

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(safeRecords.map((r) => r.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter((i) => i !== id));
        }
    };

    const allSelected = safeRecords.length > 0 && safeRecords.every((r) => selectedIds.includes(r.id));
    const someSelected = safeRecords.some((r) => selectedIds.includes(r.id));

    if (safeRecords.length === 0) return null;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <Badge size="sm" color={badgeColor}>
                    {safeRecords.length} records
                </Badge>
            </div>

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
                <div className="max-w-full overflow-x-auto">
                    <Table>
                        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                            <TableRow>
                                <TableCell isHeader className="px-5 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected && !allSelected;
                                        }}
                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                    />
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    Block
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    No
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    Nama
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                                    Period
                                </TableCell>
                                <TableCell isHeader className="px-5 py-3 text-gray-500 text-end">
                                    Amount
                                </TableCell>
                            </TableRow>
                        </TableHeader>

                        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                            {safeRecords.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell className="px-5 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(record.id)}
                                            onChange={(e) => handleSelectOne(record.id, e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                        />
                                    </TableCell>
                                    <TableCell className="px-5 py-4 font-medium">{record.block}</TableCell>
                                    <TableCell className="px-5 py-4">{record.houseNumber}</TableCell>
                                    <TableCell className="px-5 py-4">{record.fullName}</TableCell>
                                    <TableCell className="px-5 py-4">{record.period}</TableCell>
                                    <TableCell className="px-5 py-4 text-end font-medium">
                                        {formatCurrency(record.amount)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
