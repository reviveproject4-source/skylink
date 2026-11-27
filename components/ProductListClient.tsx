"use client";

import { useState } from "react";
import {
  Plus,
  Package,
  Edit2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  Link2,
  FileText,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import ProductFormModal from "./ProductFormModal";
import Link from "next/link";

interface Product {
  id: string;
  name: string;
  type: string;
  deliveryType: string;
  accessLink?: string | null;
  filePath?: string | null;
  description?: string | null;
  priceNormal: number;
  pricePromo: number;
  discountPercent: number;
  promoEndDate?: string | null;
  hasBumpOffer: boolean;
  bumpProductId?: string | null;
  bumpCustomTitle?: string | null;
  bumpCustomPrice?: number | null;
  createdAt: string;
}

interface ProductListClientProps {
  initialProducts: Product[];
}

export default function ProductListClient({
  initialProducts,
}: ProductListClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const reloadProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus produk "${name}"?`)) return;

    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProducts(products.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert("Gagal menghapus produk");
    }
  };

  const copyCheckoutLink = (id: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/checkout/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div>
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Katalog Produk Digital
          </h2>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Produk Baru</span>
        </button>
      </div>

      {/* Product List Table */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 mb-5">
            Belum ada produk digital
          </h3>
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 pl-6 pr-4">Produk Digital</th>
                  <th className="py-4 px-4">Status Aset Produk</th>
                  <th className="py-4 px-4">Harga & Diskon</th>
                  <th className="py-4 px-4">Bump Offer</th>
                  <th className="py-4 px-4">Link Checkout</th>
                  <th className="py-4 pr-6 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => {
                  const isPromoActive = p.promoEndDate
                    ? new Date(p.promoEndDate) > new Date()
                    : true;
                  const hasAsset = Boolean(p.accessLink?.trim() || p.filePath?.trim());

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* 1. Detail Produk */}
                      <td className="py-4 pl-6 pr-4 max-w-xs">
                        <div className="flex items-start gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center font-bold shrink-0 border border-brand-100/80 mt-0.5">
                            {p.deliveryType === "file" ? (
                              <FileText className="w-4 h-4" />
                            ) : (
                              <Link2 className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">
                              {p.name}
                            </h4>
                            <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                              {p.description || "Tidak ada deskripsi tambahan"}
                            </p>
                            <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                              {p.deliveryType === "file" ? "File Upload" : "Link Akses (URL)"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Status Aset Produk (Peringatan Merah jika kosong) */}
                      <td className="py-4 px-4">
                        {hasAsset ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Aset Terisi (Siap Kirim)</span>
                            </span>
                            {p.accessLink && (
                              <span className="text-[11px] text-slate-400 block truncate max-w-[200px]" title={p.accessLink}>
                                🔗 {p.accessLink}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="p-2 bg-red-50 border border-red-300 rounded-xl text-xs text-red-600 font-bold inline-flex items-center gap-1.5 animate-pulse max-w-[240px]">
                            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                            <span>⚠️ Peringatan: Produk file atau link belum terisi!</span>
                          </div>
                        )}
                      </td>

                      {/* 3. Harga & Promo */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <span className="text-xs line-through text-slate-400 block font-medium">
                            {formatRupiah(p.priceNormal)}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-extrabold text-brand-700">
                              {formatRupiah(p.pricePromo)}
                            </span>
                            {p.discountPercent > 0 && (
                              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-1.5 py-0.2 rounded">
                                -{p.discountPercent}%
                              </span>
                            )}
                          </div>
                          {p.promoEndDate && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className={isPromoActive ? "text-slate-500" : "text-red-500 font-bold"}>
                                s/d {formatDate(p.promoEndDate)}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Bump Offer */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {p.hasBumpOffer ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                              <Sparkles className="w-3 h-3 text-emerald-600" />
                              <span>+ Bump Offer</span>
                            </span>
                            {p.bumpCustomPrice ? (
                              <span className="text-[11px] text-slate-500 block font-medium">
                                {formatRupiah(p.bumpCustomPrice)}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">-</span>
                        )}
                      </td>

                      {/* 5. Link Checkout */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyCheckoutLink(p.id)}
                            className="py-1.5 px-2.5 rounded-xl text-xs font-bold bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition-colors inline-flex items-center gap-1.5"
                            title="Salin link form checkout"
                          >
                            {copiedId === p.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                          <Link
                            href={`/checkout/${p.id}`}
                            target="_blank"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                            title="Buka form checkout di tab baru"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>

                      {/* 6. Aksi */}
                      <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => {
                              setEditingProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Edit data produk"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus produk"
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

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={reloadProducts}
        editingProduct={editingProduct}
        allProducts={products}
      />
    </div>
  );
}
