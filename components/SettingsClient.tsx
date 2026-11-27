"use client";

import { useState } from "react";
import {
  Store,
  Mail,
  Phone,
  Server,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  Zap,
} from "lucide-react";

interface SettingsData {
  id: string;
  appName: string;
  storeName: string;
  sellerContactPhone: string | null;
  sellerContactEmail: string | null;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpUser: string | null;
  smtpPass: string | null;
  smtpSender: string | null;
}

interface SettingsClientProps {
  initialSettings: SettingsData;
}

export default function SettingsClient({ initialSettings }: SettingsClientProps) {
  const [formData, setFormData] = useState<SettingsData>(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan pengaturan");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner Notice */}
      <div className="bg-gradient-to-r from-brand-600 to-sky-500 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/15">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Pengaturan Toko, Email Default & WhatsApp
            </h2>
            <p className="text-xs text-brand-50/90 mt-1 leading-relaxed max-w-2xl">
              Atur email pengirim default dan nomor WhatsApp toko Anda. Seluruh materi produk digital dan ucapan terima kasih atas pembayaran otomatis dikirimkan ke email pembeli secara default.
            </p>
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>Pengaturan toko, email default, dan nomor WhatsApp berhasil disimpan!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl text-xs font-bold text-red-800 flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: IDENTITAS TOKO */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-bold text-xs">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Identitas Toko / Brand
              </h3>
              <p className="text-xs text-slate-400">
                Nama brand ini akan otomatis dicantumkan di email invoice dan pesan WhatsApp
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Toko / Brand <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.storeName || ""}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                placeholder="Contoh: Revive Project"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Tampil di subjek email & template pesan customer
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Aplikasi Engine
              </label>
              <input
                type="text"
                value={formData.appName || ""}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="SkyLink"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nama software sistem admin
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 2: EMAIL DEFAULT & WA DEFAULT */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Email Default & Nomor WhatsApp Default
              </h3>
              <p className="text-xs text-slate-400">
                Kontak resmi penjual untuk pengiriman produk otomatis dan saluran follow-up
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-600" />
                <span>Email Default Pengirim <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                required
                value={formData.sellerContactEmail || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sellerContactEmail: e.target.value,
                    smtpSender: formData.smtpSender || e.target.value,
                  })
                }
                placeholder="support@reviveproject.id"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Email ini menjadi alamat resmi pengiriman link materi digital & ucapan terima kasih
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Nomor WhatsApp Default CS <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={formData.sellerContactPhone || ""}
                onChange={(e) => setFormData({ ...formData, sellerContactPhone: e.target.value })}
                placeholder="Contoh: 081234567890"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Nomor CS yang tertera pada pesan invoice dan tujuan saat customer klik bantuan
              </p>
            </div>
          </div>
        </div>

        {/* SECTION 3: KONFIGURASI SMTP EMAIL */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold text-xs">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Konfigurasi Server SMTP (Pengiriman Email Default)
              </h3>
              <p className="text-xs text-slate-400">
                Pengaturan server SMTP agar SkyLink dapat mengirim email langsung ke inbox pembeli
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-brand-50/70 border border-brand-200 rounded-2xl text-xs text-brand-900 leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <strong>Mode Pengiriman Default:</strong> Seluruh produk digital dikirim via email. Jika Anda menggunakan Gmail, gunakan App Password 16 digit. Jika menggunakan hosting webmail, masukkan host SMTP cPanel Anda.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Host SMTP
              </label>
              <input
                type="text"
                value={formData.smtpHost || ""}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com atau mail.domainanda.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Port SMTP
              </label>
              <input
                type="number"
                value={formData.smtpPort || 587}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    smtpPort: parseInt(e.target.value) || 587,
                  })
                }
                placeholder="587 / 465"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Username SMTP
              </label>
              <input
                type="text"
                value={formData.smtpUser || ""}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="email@domainanda.com"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Password / App Password
              </label>
              <input
                type="password"
                value={formData.smtpPass || ""}
                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama / Email Pengirim (From)
              </label>
              <input
                type="text"
                value={formData.smtpSender || ""}
                onChange={(e) => setFormData({ ...formData, smtpSender: e.target.value })}
                placeholder="no-reply@reviveproject.id"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE BAR */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Menyimpan Pengaturan..." : "Simpan Pengaturan Default"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}