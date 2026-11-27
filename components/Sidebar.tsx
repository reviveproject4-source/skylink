"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FileCode2,
  Wallet,
  BarChart3,
  Sliders,
  ExternalLink,
  Zap,
  MessageSquare,
  Settings,
  PanelLeftClose,
  X,
} from "lucide-react";
import { useSidebar } from "./SidebarContext";

const navigationItems = [
  {
    name: "Halaman Utama",
    href: "/admin",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    name: "Produk",
    href: "/admin/products",
    icon: Package,
    badge: "Digital",
  },
  {
    name: "Landing Page",
    href: "/admin/landing-pages",
    icon: FileCode2,
    badge: null,
  },
  {
    name: "Keuangan",
    href: "/admin/finance",
    icon: Wallet,
    badge: null,
  },
  {
    name: "Laporan",
    href: "/admin/reports",
    icon: BarChart3,
    badge: "Funnel",
  },
  {
    name: "Integrasi",
    href: "/admin/integrations",
    icon: Sliders,
    badge: "Pixel/CAPI",
  },
  {
    name: "WhatsApp Gateway",
    href: "/admin/whatsapp",
    icon: MessageSquare,
    badge: "QR Bot",
  },
  {
    name: "Pengaturan Toko",
    href: "/admin/settings",
    icon: Settings,
    badge: "Email/WA",
  },
];

export default function Sidebar({ appName = "SkyLink" }: { appName?: string }) {
  const pathname = usePathname();
  const { isCollapsed, isMobileOpen, toggleCollapse, closeMobile } = useSidebar();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 min-h-screen transition-all duration-300 ease-in-out lg:static lg:z-auto ${
        isMobileOpen
          ? "translate-x-0 shadow-2xl"
          : "-translate-x-full lg:translate-x-0 shadow-none"
      } ${
        isCollapsed
          ? "lg:hidden"
          : "lg:flex lg:w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100 shrink-0">
        <Link
          href="/admin"
          onClick={() => {
            if (isMobileOpen) closeMobile();
          }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block leading-tight">
              {appName}
            </span>
            <span className="text-[11px] text-brand-600 font-medium tracking-wide uppercase">
              Order Engine
            </span>
          </div>
        </Link>

        {/* Buttons: Close on mobile / Collapse on desktop */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={closeMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Tutup Menu"
            aria-label="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Sembunyikan Sidebar (Perluas Tampilan)"
            aria-label="Sembunyikan Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          Menu Utama
        </p>
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (isMobileOpen) closeMobile();
              }}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? "bg-brand-50 text-brand-700 font-semibold shadow-sm shadow-brand-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive
                      ? "text-brand-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold tracking-wide uppercase ${
                    isActive
                      ? "bg-brand-200/60 text-brand-800"
                      : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/80"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Status / Footer */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 m-3 rounded-2xl">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Mode Pribadi
          </span>
          <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
            Self-Hosted
          </span>
        </div>
      </div>
    </aside>
  );
}
