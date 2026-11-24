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
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola produk digital, diskon, tanggal batas waktu, dan penawaran bump offer
          </p>
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

      {/* Product List Table / Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Belum ada produk digital
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Tambahkan produk digital pertama Anda (ebook, template, lisensi, atau kursus video) untuk mulai menerima pesanan.
          </p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => {
            const isPromoActive = p.promoEndDate
              ? new Date(p.promoEndDate) > new Date()
              : true;

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-6 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Header Tag */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 border border-brand-200/60 flex items-center gap-1">
                      {p.deliveryType === "file" ? (
                        <>
                          <FileText className="w-3 h-3" /> File Upload
                        </>
                      ) : (
                        <>
                          <Link2 className="w-3 h-3" /> Link Akses
                        </>
                      )}
                    </span>

                    {p.hasBumpOffer && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Bump Offer
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-slate-800 line-clamp-2 leading-snug group-hover:text-brand-600 transition-colors">
                    {p.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {p.description || "Tidak ada deskripsi tambahan"}
                  </p>

                  {/* Pricing info */}
                  <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-xs line-through text-slate-400 block font-medium">
                        {formatRupiah(p.priceNormal)}
                      </span>
                      <span className="text-lg font-black text-brand-700">
                        {formatRupiah(p.pricePromo)}
                      </span>
                    </div>
                    {p.discountPercent > 0 && (
                      <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-lg">
                        Hemat {p.discountPercent}%
                      </span>
                    )}
                  </div>

                  {/* Promo deadline badge */}
                  {p.promoEndDate && (
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Promo s/d:{" "}
                        <strong className={isPromoActive ? "text-slate-700" : "text-red-500"}>
                          {formatDate(p.promoEndDate)}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => copyCheckoutLink(p.id)}
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-bold bg-slate-50 hover:bg-brand-50 text-slate-700 hover:text-brand-700 border border-slate-200 hover:border-brand-300 transition-colors inline-flex items-center justify-center gap-1.5"
                    title="Salin link checkout"
                  >
                    {copiedId === p.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Link Checkout</span>
                      </>
                    )}
                  </button>

                  <Link
                    href={`/checkout/${p.id}`}
                    target="_blank"
                    className="p-2 rounded-xl text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition-colors"
                    title="Buka form checkout"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => {
                      setEditingProduct(p);
                      setIsModalOpen(true);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Edit produk"
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
              </div>
            );
          })}
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
