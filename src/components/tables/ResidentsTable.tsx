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
import Link from "next/link";

interface Resident {
  id: number;
  block: string;
  houseNumber: string;
  fullName: string;
  occupancyType: string;
  houseStatus: string;
}

export default function ResidentsTable({ data }: { data: Resident[] }) {
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
                  House No
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                  Full Name
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                  Occupancy
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-gray-500 text-start">
                  Action
                </TableCell>
              </TableRow>
            </TableHeader>

            {/* BODY */}
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {safeData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="px-5 py-4">{item.block}</TableCell>

                  <TableCell className="px-5 py-4">{item.houseNumber}</TableCell>

                  <TableCell className="px-5 py-4">{item.fullName}</TableCell>

                  <TableCell className="px-5 py-4 capitalize">
                    <Badge
                      size="sm"
                      color={
                        item.occupancyType === "owner"
                          ? "success"
                          : "warning"
                      }
                    >
                      {item.occupancyType}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Badge
                      size="sm"
                      color={item.houseStatus === "occupied" ? "success" : "error"}
                    >
                      {item.houseStatus}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-5 py-4">
                    <Link
                      href={`/residents/${item.id}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Edit
                    </Link>
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
