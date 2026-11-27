"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  ShieldCheck,
  Check,
  X,
  Layers,
  Sparkles,
} from "lucide-react";

interface MetaPixel {
  id: string;
  name: string;
  pixelId: string;
  capiToken?: string | null;
  testCode?: string | null;
  createdAt: string;
  _count?: {
    landingPages: number;
  };
}

export default function IntegrationsClient({
  initialPixels,
}: {
  initialPixels: MetaPixel[];
}) {
  const [pixels, setPixels] = useState<MetaPixel[]>(initialPixels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPixel, setEditingPixel] = useState<MetaPixel | null>(null);

  const [name, setName] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [capiToken, setCapiToken] = useState("");
  const [testCode, setTestCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const openModal = (p?: MetaPixel) => {
    if (p) {
      setEditingPixel(p);
      setName(p.name);
      setPixelId(p.pixelId);
      setCapiToken(p.capiToken || "");
      setTestCode(p.testCode || "");
    } else {
      setEditingPixel(null);
      setName("");
      setPixelId("");
      setCapiToken("");
      setTestCode("");
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingPixel
        ? `/api/integrations/${editingPixel.id}`
        : "/api/integrations";
      const method = editingPixel ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, pixelId, capiToken, testCode }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan Meta Pixel");

      if (editingPixel) {
        setPixels(
          pixels.map((item) =>
            item.id === editingPixel.id ? { ...data, _count: item._count } : item
          )
        );
      } else {
        setPixels([{ ...data, _count: { landingPages: 0 } }, ...pixels]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus pixel "${name}"? Landing Page yang menggunakan pixel ini akan beralih ke tanpa pixel.`))
      return;

    try {
      const res = await fetch(`/api/integrations/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPixels(pixels.filter((p) => p.id !== id));
      }
    } catch (e) {
      alert("Gagal menghapus pixel");
    }
  };

  const copyPixelId = (pid: string, id: string) => {
    navigator.clipboard.writeText(pid);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar Meta Pixel & CAPI (Facebook Ads)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tambahkan dan kelola beberapa Meta Pixel berbeda. Setiap Landing Page dapat menggunakan Pixel yang berbeda sesuai akun iklan Anda.
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Meta Pixel Baru</span>
        </button>
      </div>

      {/* Pixels Listing Table */}
      {pixels.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1877f2]/10 text-[#1877f2] flex items-center justify-center mx-auto mb-3 font-bold text-xl">
            f
          </div>
          <h3 className="text-base font-bold text-slate-700">
            Belum ada Meta Pixel yang ditambahkan
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Tambahkan ID Pixel Facebook/Meta pertama Anda agar bisa langsung dipilih dan dipasang pada setiap Landing Page.
          </p>
          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Pixel Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-400 text-xs uppercase font-bold tracking-wider">
                  <th className="py-4 pl-6 pr-4">Akun / Label Pixel</th>
                  <th className="py-4 px-4">Meta Pixel ID</th>
                  <th className="py-4 px-4">Status Token CAPI</th>
                  <th className="py-4 px-4">Penggunaan di LP</th>
                  <th className="py-4 pr-6 pl-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {pixels.map((p) => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* 1. Nama Akun / Label Pixel */}
                    <td className="py-4 pl-6 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#1877f2] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                          f
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
                            {p.name}
                          </h4>
                          <span className="text-[11px] text-slate-400 block">
                            Meta Ads Account
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 2. Pixel ID */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                        <span className="font-mono text-xs font-bold text-brand-700">
                          {p.pixelId}
                        </span>
                        <button
                          onClick={() => copyPixelId(p.pixelId, p.id)}
                          className="text-slate-400 hover:text-brand-600 transition-colors"
                          title="Salin Pixel ID"
                        >
                          {copiedId === p.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <span className="text-[10px] font-semibold">Salin</span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* 3. Status Token CAPI */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      {p.capiToken ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Token CAPI Terpasang Otomatis</span>
                          </span>
                          {p.testCode && (
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Test Code: {p.testCode}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium">
                          Browser Pixel Only (Tanpa CAPI)
                        </span>
                      )}
                    </td>

                    {/* 4. Penggunaan di LP */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-50 text-brand-700 border border-brand-200/70 text-xs font-bold">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{p._count?.landingPages || 0} Landing Page</span>
                      </span>
                    </td>

                    {/* 5. Aksi */}
                    <td className="py-4 pr-6 pl-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openModal(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                          title="Edit konfigurasi pixel"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus pixel"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Meta Pixel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-[#1877f2] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">
                  {editingPixel ? "Edit Meta Pixel" : "Tambah Meta Pixel Baru"}
                </h3>
                <p className="text-xs text-blue-100">
                  Konfigurasikan Pixel & CAPI untuk ditautkan ke Landing Page
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-white/20 transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Label / Akun Iklan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Pixel Produk A (Akun 1) / Pixel Ebook Scale"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Facebook / Meta Pixel ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="Contoh: 182736452819283"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Meta Conversions API (CAPI) Access Token (Opsional)
                </label>
                <textarea
                  rows={3}
                  value={capiToken}
                  onChange={(e) => setCapiToken(e.target.value)}
                  placeholder="EAAG... (Token CAPI untuk pelacakan server-to-server kebal AdBlocker)"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Test Event Code (Opsional)
                </label>
                <input
                  type="text"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value)}
                  placeholder="Contoh: TEST12345"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1877f2] hover:bg-[#166fe5] text-white shadow-md shadow-blue-500/20"
                >
                  {loading ? "Menyimpan..." : "Simpan Pixel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
