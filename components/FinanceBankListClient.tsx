"use client";

import { useState } from "react";
import { Plus, Wallet, Trash2, Edit2, CheckCircle2, XCircle, CreditCard, X } from "lucide-react";

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
  createdAt: string;
}

export default function FinanceBankListClient({
  initialBanks,
}: {
  initialBanks: BankAccount[];
}) {
  const [banks, setBanks] = useState<BankAccount[]>(initialBanks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);

  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const openModal = (b?: BankAccount) => {
    if (b) {
      setEditingBank(b);
      setBankName(b.bankName);
      setAccountNumber(b.accountNumber);
      setAccountHolder(b.accountHolder);
      setIsActive(b.isActive);
    } else {
      setEditingBank(null);
      setBankName("BCA");
      setAccountNumber("");
      setAccountHolder("");
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingBank ? `/api/banks/${editingBank.id}` : "/api/banks";
      const method = editingBank ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber, accountHolder, isActive }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan rekening");

      if (editingBank) {
        setBanks(banks.map((item) => (item.id === editingBank.id ? data : item)));
      } else {
        setBanks([data, ...banks]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus rekening ${name}?`)) return;

    try {
      const res = await fetch(`/api/banks/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBanks(banks.filter((b) => b.id !== id));
      }
    } catch (e) {
      alert("Gagal menghapus rekening");
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Rekening Bank Penampung
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar rekening tujuan transfer yang akan ditampilkan secara otomatis pada form checkout
          </p>
        </div>

        <button
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Rekening Bank</span>
        </button>
      </div>

      {banks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">
            Belum ada rekening bank yang ditambahkan
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Tambahkan nomor rekening Anda (BCA, Mandiri, BRI, BSI, Seabank, dsb) agar pembeli bisa memilih tujuan transfer manual saat checkout.
          </p>
          <button
            onClick={() => openModal()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Rekening Sekarang</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banks.map((b) => (
            <div
              key={b.id}
              className={`rounded-3xl p-6 border shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                b.isActive
                  ? "bg-gradient-to-br from-white via-brand-50/30 to-sky-50 border-brand-200"
                  : "bg-slate-50 border-slate-200 opacity-70"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                    {b.bankName.slice(0, 3).toUpperCase()}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      b.isActive
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {b.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Aktif di Checkout
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Nonaktif
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">
                  Bank {b.bankName}
                </p>
                <h3 className="font-mono text-xl font-black text-slate-900 tracking-wider my-1">
                  {b.accountNumber}
                </h3>
                <p className="text-sm font-semibold text-slate-700">
                  a.n. {b.accountHolder}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-end gap-2">
                <button
                  onClick={() => openModal(b)}
                  className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white transition-colors"
                  title="Edit rekening"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(b.id, b.bankName)}
                  className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Hapus rekening"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah / Edit Rekening */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 bg-gradient-to-r from-brand-600 to-brand-500 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingBank ? "Edit Rekening Bank" : "Tambah Rekening Bank"}
              </h3>
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
                  Nama Bank <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Contoh: BCA / Mandiri / BRI / BSI / Seabank"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nomor Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Atas Nama Rekening <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="bankActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 focus:ring-brand-500"
                />
                <label
                  htmlFor="bankActive"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Tampilkan rekening ini sebagai opsi pembayaran di checkout
                </label>
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
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-md shadow-brand-500/20"
                >
                  {loading ? "Menyimpan..." : "Simpan Rekening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
