"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogIn,
  UserRoundCog,
  UploadCloud,
  FileStack,
  BellRing,
  CalendarRange,
  HeartPulse,
  ShieldAlert,
  ListChecks,
  Target,
  Flame,
  TrendingUp,
  MessageCircleHeart,
  type LucideIcon,
} from "lucide-react";
import { T } from "@/lib/tokens";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_TOP: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/login", label: "Login", icon: LogIn },
  { href: "/profile", label: "Health details", icon: UserRoundCog },
  { href: "/chat", label: "Ask Vitalis", icon: MessageCircleHeart },
];

const NAV_LIFESTYLE = [
  { href: "/track", label: "Today's log", icon: ListChecks },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/progress", label: "Progress", icon: TrendingUp },
];

const NAV_DOCS = [
  { href: "/upload", label: "Upload document", icon: UploadCloud },
  { href: "/reports", label: "My reports", icon: FileStack },
  { href: "/reminders", label: "Medicine reminders", icon: BellRing },
  { href: "/summary", label: "Weekly summary", icon: CalendarRange },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
  return (
    <Link
      href={item.href}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors"
      style={{
        background: active ? T.primaryDeep : "transparent",
        color: active ? "#F4F6F2" : "rgba(244,246,242,0.72)",
        fontFamily: "var(--font-body)",
        fontWeight: active ? 600 : 500,
      }}
    >
      <item.icon size={17} strokeWidth={2} />
      {item.label}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden md:flex flex-col justify-between w-64 shrink-0 p-5 sticky top-0 h-screen"
      style={{ background: T.primaryDeep, backgroundImage: "linear-gradient(180deg, #093B35 0%, #071F1C 100%)", boxShadow: "8px 0 32px rgba(9, 59, 53, 0.16)" }}
    >
      <div>
        <div className="flex items-center gap-2.5 px-1 mb-8">
          <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ background: "rgba(244,246,242,0.14)" }}>
            <HeartPulse size={18} color="#F4F6F2" strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: "var(--font-display)" }}>
            <div className="text-[16px] font-semibold" style={{ color: "#F4F6F2" }}>Vitalis</div>
            <div className="text-[10.5px] tracking-wide" style={{ color: "rgba(244,246,242,0.55)" }}>PERSONAL HEALTH INTELLIGENCE</div>
          </div>
        </div>

        <div className="flex flex-col gap-1 mb-5">
          {NAV_TOP.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="px-1 mb-1.5 text-[10.5px] font-semibold tracking-wider" style={{ color: "rgba(244,246,242,0.4)" }}>
          LIFESTYLE TRACKER
        </div>
        <div className="flex flex-col gap-1 mb-5">
          {NAV_LIFESTYLE.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>

        <div className="px-1 mb-1.5 text-[10.5px] font-semibold tracking-wider" style={{ color: "rgba(244,246,242,0.4)" }}>
          DOCUMENT INTELLIGENCE
        </div>
        <div className="flex flex-col gap-1">
          {NAV_DOCS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </div>
      </div>

      <div className="rounded-lg p-3.5" style={{ background: "rgba(244,246,242,0.08)", border: "1px solid rgba(244,246,242,0.14)" }}>
        <div className="flex items-center gap-2 text-[12px] font-medium" style={{ color: "#F4F6F2", fontFamily: "var(--font-body)" }}>
          <ShieldAlert size={14} />
          Not a medical provider
        </div>
        <p className="text-[11px] mt-1 leading-relaxed" style={{ color: "rgba(244,246,242,0.6)" }}>
          Explanations and tips are informational only and don't replace advice from your doctor.
        </p>
      </div>
    </aside>
  );
}
