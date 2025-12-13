"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";

interface LoggedInUser {
  id: number;
  name: string;
  role: string;
}

export default function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  function toggleDropdown(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center text-gray-700 dark:text-gray-400"
      >
        {/* Avatar */}
        <span className="mr-3 overflow-hidden rounded-full h-11 w-11">
          <Image
            width={44}
            height={44}
            src="/images/user/user-default.jpg"
            alt="User Avatar"
          />
        </span>

        {/* Display Name */}
        <span className="block mr-1 font-medium text-theme-sm">
          {user?.name ?? "Guest"}
        </span>

        {/* Arrow */}
        <svg
          className={`stroke-gray-500 transition-transform ${isOpen ? "rotate-180" : ""
            }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Dropdown panel */}
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-4 w-[250px] rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:bg-gray-dark"
      >
        {/* User Info */}
        <div>
          <span className="block font-medium text-gray-700 text-theme-sm">
            {user?.name ?? "Guest"}
          </span>
          <span className="mt-0.5 block text-theme-xs text-gray-500">
            Role: {user?.role ?? "guest"}
          </span>
        </div>

        {/* Menu items */}
        <ul className="flex flex-col gap-1 pt-4 pb-3 border-b border-gray-200">
          {/* <li>
            <DropdownItem
              onItemClick={closeDropdown}
              tag="a"
              href="/profile"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-theme-sm hover:bg-gray-100"
            >
              Profile Settings
            </DropdownItem>
          </li> */}
        </ul>

        {/* Auth Button */}
        {user ? (
          // ======== LOGGED IN → SHOW SIGN OUT ========
          <button
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              window.location.href = "/signin";
            }}
            className="mt-3 flex w-full items-center gap-3 px-3 py-2 rounded-lg text-theme-sm hover:bg-gray-100 text-red-600"
          >
            Sign Out
          </button>
        ) : (
          // ======== GUEST → SHOW SIGN IN ========
          <Link
            href="/signin"
            onClick={closeDropdown}
            className="mt-3 flex w-full items-center gap-3 px-3 py-2 rounded-lg text-theme-sm hover:bg-gray-100 text-brand-600"
          >
            Sign In
          </Link>
        )}
      </Dropdown>
    </div>
  );
}
