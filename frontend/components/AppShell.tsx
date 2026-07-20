"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";

const PUBLIC_PATHS = ["/", "/auth", "/login", "/onboarding"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) => pathname === path || (path !== "/" && pathname.startsWith(`${path}/`)));
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (isPublicPath(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#F6FBF8] text-[#1F2937]">
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <div className="mx-auto min-h-screen w-full max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
