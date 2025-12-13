"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const menu = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Laporan Keuangan", href: "/finance-report" },
    { label: "Input Keuangan", href: "/finance-submit" },
  ];

  return (
    <div className="w-60 h-screen bg-white shadow-lg p-5 flex flex-col fixed">

      <h2 className="text-xl font-bold mb-6 text-gray-800">RT Finance</h2>

      <nav className="flex flex-col gap-2 flex-1">
        {menu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-2 rounded-md ${pathname === item.href
              ? "bg-blue-600 text-white"
              : "text-gray-700 hover:bg-gray-100"
              }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <button
        onClick={logout}
        className="mt-4 p-2 bg-red-500 text-white rounded-md hover:bg-red-600"
      >
        Logout
      </button>
    </div>
  );
}
