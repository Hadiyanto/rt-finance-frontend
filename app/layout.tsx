"use client";

import "./globals.css";
import Sidebar from "@/components/sidebar";
import { useState } from "react";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <html lang="en">
      <body className="flex bg-gray-50">

        {/* Sidebar */}
        <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* MAIN CONTENT */}
        <div className="flex-1 md:ml-60 min-h-screen">

          {/* Mobile menu button */}
          <button
            className="md:hidden p-3 fixed top-4 left-4 bg-white shadow rounded z-40"
            onClick={() => setMenuOpen(true)}
          >
            ☰
          </button>

          <main className="px-5 py-6 md:px-10 max-w-6xl mx-auto">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}
