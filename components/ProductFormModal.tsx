"use client";

import { useState, useEffect } from "react";
import { X, Upload, Link2, Sparkles, Tag, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { formatRupiah } from "@/lib/utils";

interface Product {
  id?: string;
  name: string;
  type?: string;
  deliveryType: string;
  accessLink?: string | null;
  filePath?: string | null;
  description?: string | null;
  priceNormal: number;
  pricePromo: number;
  discountPercent?: number;
  promoEndDate?: string | null;
  hasBumpOffer?: boolean;
  bumpProductId?: string | null;
  bumpCustomTitle?: string | null;
  bumpCustomPrice?: number | null;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingProduct?: Product | null;
  allProducts: Product[];
}

export default function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
  allProducts,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<Partial<Product>>({
    name: "",
    type: "digital",
    deliveryType: "link",
    accessLink: "",
    filePath: "",
    description: "",
    priceNormal: 199000,
    pricePromo: 99000,
    discountPercent: 50,
    promoEndDate: "",
    hasBumpOffer: false,
    bumpProductId: "",
    bumpCustomTitle: "",
    bumpCustomPrice: 49000,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        ...editingProduct,
        promoEndDate: editingProduct.promoEndDate
          ? new Date(editingProduct.promoEndDate).toISOString().slice(0, 16)
          : "",
      });
    } else {
      setFormData({
        name: "",
        type: "digital",
        deliveryType: "link",
        accessLink: "",
        filePath: "",
        description: "",
        priceNormal: 199000,
        pricePromo: 99000,
        discountPercent: 50,
        promoEndDate: "",
        hasBumpOffer: false,
        bumpProductId: "",
        bumpCustomTitle: "",
        bumpCustomPrice: 49000,
      });
    }
    setError(null);
  }, [editingProduct, isOpen]);

  // Auto calculate discount percentage when prices change
  const handlePriceChange = (normal: number, promo: number) => {
    let discount = 0;
    if (normal > 0 && normal > promo) {
      discount = Math.round(((normal - promo) / normal) * 100);
    }
    setFormData((prev) => ({
      ...prev,
      priceNormal: normal,
      pricePromo: promo,
      discountPercent: discount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const url = editingProduct?.id
        ? `/api/products/${editingProduct.id}`
        : "/api/products";
      const method = editingProduct?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan produk");
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-brand-600 to-brand-500 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">
              {editingProduct?.id ? "Edit Produk Digital" : "Tambah Produk Digital Baru"}
            </h3>
            <p className="text-xs text-brand-100">
              Lengkapi detail materi digital, diskon promo, dan bump offer.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Nama Produk */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Produk Digital <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Ebook Rahasia Meta Ads 2026 / Master Template Notion"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm font-medium"
            />
          </div>

          {/* Jenis Produk (Digital - Fixed) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Jenis Produk
              </label>
              <div className="px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm font-semibold flex items-center justify-between">
                <span>Produk Digital</span>
                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  Instant Delivery
                </span>
              </div>
            </div>

            {/* Opsi Pengiriman: Upload File / Link */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Metode Pengiriman Aset
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: "link" })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    formData.deliveryType === "link"
                      ? "bg-brand-50 border-brand-500 text-brand-700 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Link2 className="w-3.5 h-3.5" />
                  Link Akses (URL)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: "file" })}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                    formData.deliveryType === "file"
                      ? "bg-brand-50 border-brand-500 text-brand-700 shadow-xs"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload File
                </button>
              </div>
            </div>
          </div>

          {/* Delivery Target Input */}
          {formData.deliveryType === "link" ? (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Link Akses Produk (Google Drive / Notion / Portal) <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                required={formData.deliveryType === "link"}
                value={formData.accessLink || ""}
                onChange={(e) => setFormData({ ...formData, accessLink: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Link ini akan otomatis dikirimkan ke email pembeli setelah status order tercatat lunas.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Upload File Produk (PDF / ZIP / EPUB)
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-brand-400 transition-colors bg-slate-50/50">
                <Upload className="w-8 h-8 text-brand-500 mx-auto mb-1.5" />
                <p className="text-xs font-semibold text-slate-700">
                  Klik untuk memilih file materi digital Anda
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Mendukung PDF, ZIP, MP4 hingga 100MB
                </p>
                <input
                  type="text"
                  placeholder="Atau masukkan path file lokal (misal: /uploads/materi.pdf)"
                  value={formData.filePath || ""}
                  onChange={(e) => setFormData({ ...formData, filePath: e.target.value })}
                  className="mt-3 w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                />
              </div>
            </div>
          )}

          {/* Peringatan Tulisan Merah Jika Link/File Belum Diisi */}
          {!Boolean(formData.accessLink?.trim() || formData.filePath?.trim()) && (
            <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl flex items-center gap-2.5 text-xs text-red-600 font-bold">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="text-red-600 font-bold">
                ⚠️ Peringatan: Produk file atau link belum terisi! Harap masukkan URL link akses atau file materi digital agar pembeli menerima produk otomatis.
              </span>
            </div>
          )}

          {/* Pricing Section (Harga Jual, Promo, Diskon) */}
          <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 space-y-4">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-600" />
              Struktur Harga & Diskon
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Harga Normal (Coret)
                </label>
                <input
                  type="number"
                  required
                  value={formData.priceNormal || 0}
                  onChange={(e) =>
                    handlePriceChange(
                      parseFloat(e.target.value) || 0,
                      formData.pricePromo || 0
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Harga Promo (Jual)
                </label>
                <input
                  type="number"
                  required
                  value={formData.pricePromo || 0}
                  onChange={(e) =>
                    handlePriceChange(
                      formData.priceNormal || 0,
                      parseFloat(e.target.value) || 0
                    )
                  }
                  className="w-full px-3 py-2 rounded-xl border border-brand-300 bg-brand-50/30 text-sm font-bold text-brand-700"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Diskon (%)
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={formData.discountPercent || 0}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discountPercent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700"
                  />
                  <span className="text-xs font-bold text-slate-400">%</span>
                </div>
              </div>
            </div>

            {/* Tanggal Promo Selesai (Countdown Deadline) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal & Jam Promo Selesai (Batas Waktu Countdown)
              </label>
              <input
                type="datetime-local"
                value={formData.promoEndDate || ""}
                onChange={(e) => setFormData({ ...formData, promoEndDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Akan memicu countdown timer di form checkout untuk menciptakan urgensi pembeli.
              </p>
            </div>
          </div>

          {/* Deskripsi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi Singkat Produk
            </label>
            <textarea
              rows={2}
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Jelaskan secara singkat apa yang akan didapatkan oleh pembeli..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-brand-500 text-sm font-medium"
            />
          </div>

          {/* BUMP OFFER CONFIGURATION */}
          <div className="p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                  Bump Offer (Penawaran Tambahan di Form Checkout)
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.hasBumpOffer || false}
                  onChange={(e) =>
                    setFormData({ ...formData, hasBumpOffer: e.target.checked })
                  }
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {formData.hasBumpOffer && (
              <div className="pt-3 border-t border-emerald-200/60 space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-emerald-700">
                  Pilih produk pelengkap yang akan ditawarkan langsung di form checkout:
                </p>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Pilih Produk untuk Bump Offer:
                  </label>
                  <select
                    value={formData.bumpProductId || ""}
                    onChange={(e) => setFormData({ ...formData, bumpProductId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  >
                    <option value="">-- Pilih dari Katalog Produk --</option>
                    {allProducts
                      .filter((p) => p.id !== editingProduct?.id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({formatRupiah(p.pricePromo)})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Judul Penawaran Bump (Call to Action)
                    </label>
                    <input
                      type="text"
                      value={formData.bumpCustomTitle || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, bumpCustomTitle: e.target.value })
                      }
                      placeholder="Contoh: Ya, tambahkan Ebook Studi Kasus Eksklusif!"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Harga Spesial Bump Offer
                    </label>
                    <input
                      type="number"
                      value={formData.bumpCustomPrice || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bumpCustomPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-emerald-700 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20 transition-all disabled:opacity-50"
            >
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
