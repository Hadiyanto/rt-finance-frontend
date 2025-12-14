"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";

import {
  GridIcon,
  ListIcon,
  PlugInIcon,
  ChevronDownIcon,
  HorizontaLDots,
} from "../icons/index";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Dashboard",
    path: "/",
  },
  {
    icon: <ListIcon />,
    name: "Transactions",
    path: "/finances",
  },
  {
    icon: <ListIcon />,
    name: "Submit Contribution",
    path: "/contributions/submit",
  },

  {
    icon: <ListIcon />,
    name: "Submit Transaction",
    path: "/transaction/submit",
  },
  {
    icon: <ListIcon />,
    name: "Residents",
    path: "/residents",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    path: "/signin",
  },
];

const AppSidebar: React.FC = () => {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    setIsMobileOpen,
  } = useSidebar();

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  // AUTO CLOSE SIDEBAR WHEN CLICK MENU ON MOBILE
  const handleMenuClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen(false);
    }
  };

  // ACTIVE PATH LOGIC
  const isActive = useCallback((path: string) => path === pathname, [pathname]);

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);

  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // OPEN SUBMENU IF CURRENT PATH MATCHES
  useEffect(() => {
    let matched = false;

    ["main", "others"].forEach((type) => {
      const items = type === "main" ? navItems : othersItems;

      items.forEach((nav, index) => {
        nav.subItems?.forEach((sub) => {
          if (isActive(sub.path)) {
            matched = true;
            setOpenSubmenu({ type: type as any, index });
          }
        });
      });
    });

    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive]);

  // UPDATE SUBMENU HEIGHT
  useEffect(() => {
    if (!openSubmenu) return;

    const key = `${openSubmenu.type}-${openSubmenu.index}`;
    const el = subMenuRefs.current[key];
    if (el) {
      setSubMenuHeight((prev) => ({
        ...prev,
        [key]: el.scrollHeight,
      }));
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, type: "main" | "others") => {
    setOpenSubmenu((prev) =>
      prev?.index === index && prev?.type === type ? null : { type, index }
    );
  };

  // RENDER MENU ITEMS
  const renderMenuItems = (
    items: NavItem[],
    type: "main" | "others"
  ) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {/* SUBMENU */}
          {nav.subItems ? (
            <button
              onClick={() => {
                handleSubmenuToggle(index, type);
                handleMenuClick(); // mobile auto-close
              }}
              className={`menu-item group ${openSubmenu?.index === index && openSubmenu?.type === type
                ? "menu-item-active"
                : "menu-item-inactive"
                }`}
            >
              <span
                className={`${openSubmenu?.index === index && openSubmenu?.type === type
                  ? "menu-item-icon-active"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>

              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}

              {(isExpanded || isHovered || isMobileOpen) && (
                <span
                  className={`ml-auto transition-transform ${openSubmenu?.index === index ? "rotate-180 text-brand-500" : ""
                    }`}
                >
                  <ChevronDownIcon />
                </span>
              )}
            </button>
          ) : (
            // NORMAL LINK
            nav.path && (
              <Link
                href={nav.path}
                onClick={handleMenuClick} // AUTO CLOSE MOBILE
                className={`menu-item group ${isActive(nav.path)
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>

                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* SUBMENU CONTENT */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${type}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === type && openSubmenu?.index === index
                    ? `${subMenuHeight[`${type}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="ml-9 mt-2 space-y-1">
                {nav.subItems.map((s) => (
                  <li key={s.name}>
                    <Link
                      href={s.path}
                      onClick={handleMenuClick}
                      className={`menu-dropdown-item ${isActive(s.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen px-5 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300
        ${isExpanded || isMobileOpen ? "w-[290px]" : isHovered ? "w-[290px]" : "w-[90px]"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo */}
      <div className={`py-8 flex ${!isExpanded && !isHovered ? "lg:justify-center" : ""}`}>
        <Link href="/">
          {isExpanded || isHovered || isMobileOpen ? (
            <>
              <Image src="/images/logo/gmmicon.svg" alt="Logo" width={54} height={40} className="dark:hidden" />
              <Image src="/images/logo/gmmicon.svg" alt="Logo" width={54} height={40} className="hidden dark:block" />
            </>
          ) : (
            <Image src="/images/logo/gmmicon.svg" alt="Logo" width={32} height={32} />
          )}
        </Link>
      </div>

      {/* Menu */}
      <div
        className={`overflow-y-auto no-scrollbar transition-all duration-300
    ${isMobileOpen ? "pl-5" : ""}
  `}
      >
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* MAIN */}
            <div>
              <h2
                className={`mb-4 text-xs uppercase text-gray-400 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? "Menu" : <HorizontaLDots />}
              </h2>

              {renderMenuItems(
                navItems.filter((item) => {
                  const hideGuest = ["Residents", "Submit Transaction", "Submit Contribution"];
                  const hideLogin = ["Residents"];

                  if (isLoggedIn && hideLogin.includes(item.name)) {
                    return false; // sembunyikan
                  } else if (!isLoggedIn && hideGuest.includes(item.name)) {
                    return false; // sembunyikan
                  }

                  return true; // tampilkan lainnya
                }),
                "main"
              )}

            </div>

            {/* OTHERS */}
            <div>
              {renderMenuItems(
                othersItems.filter((item) =>
                  item.name === "Authentication" && isLoggedIn ? false : true
                ),
                "others"
              )}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
