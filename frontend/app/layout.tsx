import type { Metadata } from "next";
import {
  Inter,
  IBM_Plex_Mono,
} from "next/font/google";

import Sidebar from "@/components/Sidebar";
import { T } from "@/lib/tokens";

import "./globals.css";

const display = Inter({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
});

const body = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Meridian — AI Health Companion",
  description:
    "Reads your reports, explains them simply, and keeps you on track.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body
        className="h-screen overflow-hidden"
        style={{ background: T.canvas }}
      >
        <div className="flex h-screen">
          <Sidebar />

          <main className="flex-1 overflow-y-auto bg-[#F4F6F2] p-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
