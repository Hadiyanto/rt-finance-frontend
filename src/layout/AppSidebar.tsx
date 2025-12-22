"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";

import {
  CalendarCheck,
  ReceiptText,
  Users,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "../context/SidebarContext";
import { ListIcon, PlugInIcon, ChevronDownIcon } from "../icons/index";

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------
type SubItem = { name: string; path: string };

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: SubItem[];
};

type MenuGroup = "active" | "others";

// ---------------------------------------------------------
// MENUS
// ---------------------------------------------------------
export const guestMenu: NavItem[] = [
  {
    icon: <CalendarCheck />,
    name: "Pay Monthly Fee",
    path: "/contributions/submit",
  },
  // {
  //   icon: <ListIcon />,
  //   name: "Monthly Fee Report",
  //   path: "/monthly",
  // },
  // {
  //   icon: <ReceiptText />,
  //   name: "Transactions",
  //   path: "/finances",
  // },
];

export const userMenu: NavItem[] = [
  {
    icon: <Users />,
    name: "Residents",
    path: "/residents",
  },
  {
    icon: <ReceiptText />,
    name: "Transactions",
    path: "/finances",
  },
  {
    icon: <CalendarCheck />,
    name: "Pay Monthly Fee",
    path: "/contributions/submit",
  },
  {
    icon: <ListIcon />,
    name: "Monthly Fee Report",
    path: "/monthly",
  },
  {
    icon: <ListIcon />,
    name: "Submit Transaction",
    path: "/transaction/submit",
  },
];

export const othersItems: NavItem[] = [
  {
    icon: <PlugInIcon />,
    name: "Sign In",
    path: "/signin",
  },
];

// ---------------------------------------------------------
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

  // Detect login
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  // Determine menu for user
  const activeMenu: NavItem[] = useMemo(
    () => (isLoggedIn ? userMenu : guestMenu),
    [isLoggedIn]
  );

  // Auto close mobile
  const handleMenuClick = () => {
    if (window.innerWidth < 1024) setIsMobileOpen(false);
  };

  // Path active checker
  const isActive = useCallback((path: string) => pathname === path, [pathname]);

  // Submenu state
  const [openSubmenu, setOpenSubmenu] = useState<{
    type: MenuGroup;
    index: number;
  } | null>(null);

  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>({});

  // Auto-open submenu if path matches
  useEffect(() => {
    let matched = false;

    activeMenu.forEach((nav, index) => {
      nav.subItems?.forEach((sub) => {
        if (isActive(sub.path)) {
          matched = true;
          setOpenSubmenu({ type: "active", index });
        }
      });
    });

    othersItems.forEach((nav, index) => {
      nav.subItems?.forEach((sub) => {
        if (isActive(sub.path)) {
          matched = true;
          setOpenSubmenu({ type: "others", index });
        }
      });
    });

    if (!matched) setOpenSubmenu(null);
  }, [pathname, isActive, activeMenu]);

  // Update submenu height
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

  const toggleSubmenu = (index: number, type: MenuGroup) => {
    setOpenSubmenu((prev) =>
      prev && prev.index === index && prev.type === type
        ? null
        : { type, index }
    );
  };

  // Render menu items
  const renderMenuItems = (items: NavItem[], type: MenuGroup) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => {
        const key = `${type}-${index}`;

        return (
          <li key={nav.name}>
            {/* Submenu Button */}
            {nav.subItems ? (
              <button
                onClick={() => {
                  toggleSubmenu(index, type);
                  handleMenuClick();
                }}
                className={`menu-item group ${openSubmenu?.type === type &&
                  openSubmenu?.index === index
                  ? "menu-item-active"
                  : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`${openSubmenu?.type === type &&
                    openSubmenu?.index === index
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
                    className={`ml-auto transition-transform ${openSubmenu?.type === type &&
                      openSubmenu?.index === index
                      ? "rotate-180 text-brand-500"
                      : ""
                      }`}
                  >
                    <ChevronDownIcon />
                  </span>
                )}
              </button>
            ) : (
              // Standard Link
              nav.path && (
                <Link
                  href={nav.path}
                  onClick={handleMenuClick}
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

            {/* Submenu Items */}
            {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
              <div
                ref={(el) => {
                  subMenuRefs.current[key] = el;
                }}
                className="overflow-hidden transition-all duration-300"
                style={{
                  height:
                    openSubmenu?.type === type &&
                      openSubmenu?.index === index
                      ? `${subMenuHeight[key] || 0}px`
                      : "0px",
                }}
              >
                <ul className="ml-9 mt-2 space-y-1">
                  {nav.subItems.map((sub) => (
                    <li key={sub.name}>
                      <Link
                        href={sub.path}
                        onClick={handleMenuClick}
                        className={`menu-dropdown-item ${isActive(sub.path)
                          ? "menu-dropdown-item-active"
                          : "menu-dropdown-item-inactive"
                          }`}
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-screen px-5 bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300
        ${isExpanded || isMobileOpen
          ? "w-[290px]"
          : isHovered
            ? "w-[290px]"
            : "w-[90px]"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* SPACER */}
      <div className="py-8" />

      {/* MENU */}
      <div className={`py-8 flex overflow-y-auto no-scrollbar ${isMobileOpen ? "pl-5" : ""}`}>
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            {/* MAIN */}
            <div>
              <h2 className="mb-4 text-xs uppercase text-gray-400">Menu</h2>
              {renderMenuItems(activeMenu, "active")}
            </div>

            {/* OTHERS */}
            <div>
              {renderMenuItems(
                othersItems.filter((o) => !(o.name === "Sign In" && isLoggedIn)),
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
