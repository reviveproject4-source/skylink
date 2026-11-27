"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  FileCode2,
  ExternalLink,
  Edit2,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  CheckCircle,
  Eye,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface LandingPage {
  id: string;
  title: string;
  slug: string;
  htmlContent: string;
  isLive: boolean;
  viewsCount: number;
  updatedAt: string;
  metaPixelId?: string | null;
  customPixelId?: string | null;
  metaPixel?: {
    id: string;
    name: string;
    pixelId: string;
  } | null;
  product?: {
    id: string;
    name: string;
    accessLink?: string | null;
    filePath?: string | null;
  } | null;
}

export default function LandingPageListClient({
  initialPages,
}: {
  initialPages: LandingPage[];
}) {
  const [pages, setPages] = useState<LandingPage[]>(initialPages);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const checkHasPixel = (html: string, pixelId?: string | null): boolean => {
    if (!html) return false;
    const lower = html.toLowerCase();
    if (pixelId) {
      return html.includes(pixelId);
    }
    return lower.includes("fbq(") || lower.includes("connect.facebook.net");
  };

  const copyPageLink = (slug: string, id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/lp/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Hapus landing page "${title}"?`)) return;

    try {
      const res = await fetch(`/api/landing-pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPages(pages.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert("Gagal menghapus landing page");
    }
  };

  return (
    <div>
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar Landing Page
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola landing page promosi Anda, status live, dan verifikasi pelacakan Meta Pixel per halaman
          </p>
        </div>

        <Link
          href="/admin/landing-pages/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Landing Page Baru</span>
        </Link>
      </div>

      {/* Pages Listing */}
      {pages.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <FileCode2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Belum ada landing page yang dibuat
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Buka LP Studio (editor layar terbagi 2) untuk membuat atau mengunggah kode HTML landing page pertama Anda.
          </p>
          <Link
            href="/admin/landing-pages/studio"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Mulai Buat di Studio</span>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold bg-slate-50/50">
                  <th className="py-4 pl-6">Halaman & URL</th>
                  <th className="py-4">Produk Terhubung</th>
                  <th className="py-4">Meta Pixel</th>
                  <th className="py-4">Status Kode</th>
                  <th className="py-4">Pengunjung</th>
                  <th className="py-4 text-right pr-6">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pages.map((p) => {
                  const assignedPixelId =
                    p.metaPixel?.pixelId || p.customPixelId || null;
                  const hasPixel = checkHasPixel(
                    p.htmlContent,
                    assignedPixelId
                  );

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="py-4 pl-6">
                        <Link
                          href={`/admin/landing-pages/studio/${p.id}`}
                          className="font-bold text-slate-900 hover:text-brand-600 transition-colors block text-sm"
                        >
                          {p.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyPageLink(p.slug, p.id)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 font-mono text-xs font-bold border border-sky-200 transition-all cursor-pointer shadow-2xs"
                            title="Salin Link LP lengkap untuk ditempel di Meta Ads Manager"
                          >
                            {copiedId === p.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Link Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-sky-600" />
                                <span>/lp/{p.slug}</span>
                                <span className="text-[10px] text-sky-600 font-semibold bg-sky-100 px-1.5 py-0.2 rounded">Salin Meta</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-4">
                        {p.product ? (
                          <div>
                            <span className="font-medium text-slate-800 text-xs block">
                              {p.product.name}
                            </span>
                            {!Boolean(p.product.accessLink || p.product.filePath) && (
                              <span className="inline-block mt-0.5 text-[10px] text-red-600 bg-red-50 border border-red-300 px-1.5 py-0.5 rounded font-bold">
                                ⚠️ Produk file atau link belum terisi
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Belum terhubung
                          </span>
                        )}
                      </td>

                      <td className="py-4">
                        {p.metaPixel ? (
                          <div>
                            <span className="font-bold text-xs text-slate-800 block">
                              {p.metaPixel.name}
                            </span>
                            <span className="font-mono text-[11px] text-[#1877f2] font-semibold">
                              {p.metaPixel.pixelId}
                            </span>
                          </div>
                        ) : p.customPixelId ? (
                          <span className="font-mono text-xs text-[#1877f2] font-bold">
                            {p.customPixelId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">
                            Tanpa Pixel
                          </span>
                        )}
                      </td>

                      <td className="py-4">
                        {hasPixel ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Pixel Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600 border border-red-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Pixel Belum Terpasang
                          </span>
                        )}
                      </td>

                      <td className="py-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Eye className="w-3.5 h-3.5 text-slate-400" />
                          {p.viewsCount} view
                        </span>
                      </td>

                      <td className="py-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => copyPageLink(p.slug, p.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Salin Link LP"
                          >
                            {copiedId === p.id ? (
                              <Check className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>

                          <Link
                            href={`/lp/${p.slug}`}
                            target="_blank"
                            className="p-2 rounded-xl text-slate-500 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Buka Halaman Live"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/admin/landing-pages/studio/${p.id}`}
                            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit di Studio Split-Screen"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDelete(p.id, p.title)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus LP"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
