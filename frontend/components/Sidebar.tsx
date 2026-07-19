"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BellRing,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  FileStack,
  Flame,
  LayoutDashboard,
  ListChecks,
  MessageCircleHeart,
  Target,
  TrendingUp,
  UploadCloud,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NAV_TOP: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/profile",
    label: "Health Details",
    icon: UserRoundCog,
  },
  {
    href: "/chat",
    label: "Ask Vitalis",
    icon: MessageCircleHeart,
  },
];

const NAV_LIFESTYLE: NavItem[] = [
  {
    href: "/track",
    label: "Today's Log",
    icon: ListChecks,
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
  },
  {
    href: "/habits",
    label: "Habits",
    icon: Flame,
  },
  {
    href: "/progress",
    label: "Progress",
    icon: TrendingUp,
  },
];

const NAV_DOCS: NavItem[] = [
  {
    href: "/upload",
    label: "Upload Document",
    icon: UploadCloud,
  },
  {
    href: "/reports",
    label: "My Reports",
    icon: FileStack,
  },
  {
    href: "/reminders",
    label: "Medicine Reminders",
    icon: BellRing,
  },
  {
    href: "/summary",
    label: "Weekly Summary",
    icon: CalendarRange,
  },
];

function Section({
  title,
  collapsed,
}: {
  title: string;
  collapsed: boolean;
}) {
  return (
    <div
      className={`overflow-hidden transition-[height,opacity,margin] duration-300 ease-out ${
        collapsed ? "my-2 h-px opacity-100" : "mt-6 mb-2 h-5 opacity-100"
      }`}
    >
      {collapsed ? (
        <div className="mx-3 h-px rounded-full bg-slate-200" />
      ) : (
        <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
          {title}
        </p>
      )}
    </div>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const active =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={`
        group
        relative
        grid
        h-12
        grid-cols-[48px_1fr]
        items-center
        rounded-2xl
        px-2
        transition-colors
        duration-200
        ${
          active
            ? "bg-[#166534] text-white shadow-md shadow-emerald-900/10"
            : "text-slate-600 hover:bg-white/70"
        }
      `}
    >
      {/* Icon */}

      <div className="flex h-12 w-12 items-center justify-center">
        <item.icon
          size={20}
          className="transition-transform duration-200 group-hover:scale-105"
        />
      </div>

      {/* Label */}

      <div className="overflow-hidden">
        <span
          className={`
            block
            whitespace-nowrap
            text-[15px]
            font-medium
            transition-all
            duration-200
            ease-out
            ${
              collapsed
                ? "translate-x-3 opacity-0"
                : "translate-x-0 opacity-100 delay-75"
            }
          `}
        >
          {item.label}
        </span>
      </div>

      {/* Hover glow */}

      {!active && (
        <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-transparent transition group-hover:ring-slate-200" />
      )}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`
        hidden
        md:flex
        h-screen
        sticky
        top-0
        flex-col
        overflow-hidden
        border-r
        border-slate-200
        bg-[#E4EFE8]
        shadow-[0_8px_32px_rgba(15,23,42,0.05)]
        transition-[width]
        duration-500
        ease-[cubic-bezier(.22,1,.36,1)]
        ${collapsed ? "w-[76px]" : "w-[280px]"}
      `}
    >
      <div
        className={`
          flex-1
          overflow-y-auto
          transition-[padding]
          duration-500
          ease-[cubic-bezier(.22,1,.36,1)]
          ${collapsed ? "px-2 py-5" : "px-4 py-5"}
        `}
      >
        {/* ---------- Header ---------- */}

       <div className="relative group">
  {/* Floating Toggle */}

  <button
    onClick={() => setCollapsed((v) => !v)}
    className={`
      absolute
      top-1/2
      -right-3
      -translate-y-1/2
      z-20
      flex
      h-7
      w-7
      items-center
      justify-center
      rounded-full
      border
      border-slate-200
      bg-white
      shadow-sm
      transition-all
      duration-200
      hover:scale-105
      hover:shadow-md
      ${
        collapsed
          ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"
          : "opacity-100"
      }
    `}
  >
    {collapsed ? (
      <ChevronRight size={14}   className="text-slate-700 stroke-[2.25] flex-shrink-0"/>
    ) : (
      <ChevronLeft size={14}   className="text-slate-700 stroke-[2.25] flex-shrink-0"/>
    )}
  </button>

  {/* Header */}

  <div
    className={`
      grid
      w-full
      grid-cols-[48px_1fr]
      items-center
      rounded-2xl
      p-2
      transition-colors
      duration-200
      hover:bg-white/50
    `}
  >
    {/* Logo */}

    <div className="flex h-12 w-12 items-center justify-center">
      <Image
        src="/brand/logoc.png"
        alt="Vitalis"
        width={44}
        height={44}
        className="object-contain transition-transform duration-200 group-hover:scale-105"
      />
    </div>

    {/* Brand */}

    <div className="overflow-hidden">
      <div
        className={`
          transition-all
          duration-200
          ease-out
          ${
            collapsed
              ? "translate-x-3 opacity-0"
              : "translate-x-0 opacity-100"
          }
        `}
      >
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Vitalis
        </h2>

        <p className="mt-0.5 text-[11px] uppercase tracking-[0.18em] text-slate-500">
          PERSONAL HEALTH
        </p>
      </div>
    </div>
  </div>
</div>

        {/* ---------- Navigation ---------- */}

        <nav className="mt-8 space-y-1">
          {NAV_TOP.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}

          <Section
            title="Lifestyle"
            collapsed={collapsed}
          />

          {NAV_LIFESTYLE.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}

          <Section
            title="Documents"
            collapsed={collapsed}
          />

          {NAV_DOCS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>
                {/* ---------- Footer ---------- */}

        <div className="mt-8" />

      </div>

      <div
        className={`
          border-t
          border-[#D7E4DC]
          transition-all
          duration-500
          ease-[cubic-bezier(.22,1,.36,1)]
          ${collapsed ? "p-2" : "p-4"}
        `}
      >
        <button
          className={`
            group
            grid
            w-full
            grid-cols-[48px_1fr]
            items-center
            rounded-2xl
            transition-colors
            duration-200
            hover:bg-white/50
            ${collapsed ? "p-2" : "p-3"}
          `}
        >
          {/* Icon */}

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
            <Activity
              size={20}
              className="text-emerald-600 transition-transform duration-200 group-hover:scale-105"
            />
          </div>

          {/* Text */}

          <div className="overflow-hidden">
            <div
              className={`
                transition-all
                duration-200
                ease-out
                ${
                  collapsed
                    ? "translate-x-3 opacity-0"
                    : "translate-x-0 opacity-100 delay-75"
                }
              `}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  Health Sync
                </h4>

                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="text-[11px] font-medium text-emerald-700">
                    Live
                  </span>
                </div>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Connected to Google Fit
              </p>
            </div>
          </div>
        </button>
      </div>
    </aside>
  );
}