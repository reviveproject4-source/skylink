"use client";

import Link from "next/link";
import { ExternalLink, User, Settings, CheckCircle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

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
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-3.5">
        {activeLpSlug && (
          <Link
            href={`/lp/${activeLpSlug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg transition-colors border border-brand-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka Halaman Live</span>
          </Link>
        )}

        {/* Revenue Display */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-emerald-600 uppercase tracking-wider">
            Total Masuk:
          </span>
          <span className="font-bold text-sm">
            {formatRupiah(totalRevenue)}
          </span>
        </div>

        {/* Profile Avatar */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
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
