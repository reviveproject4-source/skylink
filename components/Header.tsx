"use client";

import Link from "next/link";
import {
  ExternalLink,
  User,
  Settings,
  CheckCircle,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { useSidebar } from "./SidebarContext";

interface HeaderProps {
  title: string;
  totalRevenue?: number;
  activeLpSlug?: string | null;
}

export default function Header({
  title,
  totalRevenue = 0,
  activeLpSlug,
}: HeaderProps) {
  const { isCollapsed, toggleCollapse, toggleMobile } = useSidebar();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {/* Tombol menu di Mobile (HP) */}
        <button
          type="button"
          onClick={toggleMobile}
          className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
          title="Buka Menu"
          aria-label="Buka Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Tombol Sembunyikan/Tampilkan Sidebar di Desktop (Web) */}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all border shadow-2xs shrink-0 ${
            isCollapsed
              ? "bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100"
              : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/80 hover:text-slate-900"
          }`}
          title={
            isCollapsed
              ? "Tampilkan Menu Sidebar"
              : "Sembunyikan Menu Sidebar (Perluas Layar Laporan)"
          }
          aria-label="Toggle Sidebar"
        >
          {isCollapsed ? (
            <>
              <PanelLeftOpen className="w-4 h-4 text-brand-600" />
              <span>Tampilkan Menu</span>
            </>
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4 text-slate-500" />
              <span>Sembunyikan Menu</span>
            </>
          )}
        </button>

        <h1 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight truncate">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3.5 shrink-0">
        {activeLpSlug && (
          <Link
            href={`/lp/${activeLpSlug}`}
            target="_blank"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Halaman Live</span>
          </Link>
        )}

        {/* Revenue Display */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="hidden sm:inline text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Total Masuk:
          </span>
          <span className="font-bold text-xs sm:text-sm">
            {formatRupiah(totalRevenue)}
          </span>
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-slate-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            ME
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold text-slate-800 leading-none">
              Admin Personal
            </span>
            <span className="text-[10px] text-slate-400">Pemilik Sistem</span>
          </div>
        </div>
      </div>
    </header>
  );
}
