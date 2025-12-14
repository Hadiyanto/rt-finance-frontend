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

interface FinanceEntry {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: {
    id: number;
    name: string;
  };
  type: {
    id: number;
    name: string; // income | expense
  };
}

export default function FinancesTable({ data }: { data: FinanceEntry[] }) {
  const safeData = Array.isArray(data) ? data : [];

  // SORT newest date first
  const sortedData = [...safeData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }

  function formatCurrency(amount: number) {
    return amount.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
    });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[900px]">
          <Table>
            {/* HEADER */}
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500">
                  Description
                </TableCell>

                <TableCell isHeader className="px-5 py-3 text-start text-gray-500">
                  Category
                </TableCell>

                <TableCell isHeader className="px-5 py-3 text-start text-gray-500">
                  Type
                </TableCell>

                <TableCell isHeader className="px-5 py-3 text-start text-gray-500">
                  Amount
                </TableCell>

                {/* DATE → moved to last column */}
                <TableCell isHeader className="px-5 py-3 text-start text-gray-500">
                  Date
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* BODY */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {sortedData.map((item) => (
                <TableRow key={item.id}>

                  <TableCell className="px-5 py-4">{item.description}</TableCell>

                  <TableCell className="px-5 py-4">
                    <Badge size="sm" color="info">
                      {item.category.name}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={item.type.name === "income" ? "success" : "error"}
                    >
                      {item.type.name}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4 font-medium">
                    {formatCurrency(item.amount)}
                  </TableCell>

                  {/* DATE COLUMN */}
                  <TableCell className="px-5 py-4">
                    {formatDate(item.date)}
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
