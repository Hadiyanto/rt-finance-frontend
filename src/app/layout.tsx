import type { Metadata, Viewport } from "next";
import { Outfit, Public_Sans, Plus_Jakarta_Sans } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/context/ThemeContext";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import NotificationPrompt from "@/components/NotificationPrompt";

// =======================
// Fonts
// =======================

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-public-sans",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
  display: "swap",
});

// =======================
// Metadata
// =======================

export const metadata: Metadata = {
  title: "GMM 001 - Graha Mampang Mas",
  description: "Sistem Keuangan RT 001/016 Graha Mampang Mas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "GMM 001",
  },
};

// =======================
// Viewport
// =======================

export const viewport: Viewport = {
  themeColor: "#9B1B30",
};

// =======================
// Layout
// =======================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={[
          outfit.className,
          publicSans.variable,
          plusJakartaSans.variable,
          "dark:bg-gray-900",
        ].join(" ")}
      >
        <ServiceWorkerRegistration />
        <NotificationPrompt />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
