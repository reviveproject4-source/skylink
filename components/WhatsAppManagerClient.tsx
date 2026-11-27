"use client";

import { useState, useEffect } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Send,
  LogOut,
  Smartphone,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Zap,
} from "lucide-react";

interface WAStatus {
  status: "DISCONNECTED" | "CONNECTING" | "WAITING_QR" | "CONNECTED";
  qrCodeDataUrl: string | null;
  userInfo: { id?: string; name?: string; phone?: string } | null;
}

export default function WhatsAppManagerClient() {
  const [waData, setWaData] = useState<WAStatus>({
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    userInfo: null,
  });

  const [loading, setLoading] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState(
    "Halo! Ini adalah pesan uji coba dari sistem SkyLink Order Flow WhatsApp Gateway."
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testSuccess, setTestSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);

  // Poll status
  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/whatsapp/status");
      const data = await res.json();
      setWaData(data);
    } catch (e) {
      console.error("Fetch WA status error:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await fetch("/api/whatsapp/connect", { method: "POST" });
      await fetchStatus();
    } catch (e) {
      alert("Gagal memulai koneksi WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Putuskan koneksi WhatsApp dari aplikasi?")) return;
    setLoading(true);
    try {
      await fetch("/api/whatsapp/disconnect", { method: "POST" });
      await fetchStatus();
    } catch (e) {
      alert("Gagal memutuskan koneksi WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingTest(true);
    setTestSuccess(false);
    setTestError(null);

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone, message: testMessage }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim pesan");

      setTestSuccess(true);
      setTimeout(() => setTestSuccess(false), 3000);
    } catch (err: any) {
      setTestError(err.message);
    } finally {
      setSendingTest(false);
    }
  };

  const copyTemplate = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(id);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          WhatsApp Gateway (Self-Hosted Bot)
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: CONNECTION CARD (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <QrCode className="w-4 h-4 text-brand-600" />
              Status Perangkat WhatsApp
            </h3>

            {waData.status === "CONNECTED" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Terhubung
              </span>
            ) : waData.status === "WAITING_QR" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Menunggu Scan
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                Terputus
              </span>
            )}
          </div>

          {/* CONNECTED STATE */}
          {waData.status === "CONNECTED" && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-800">
                  {waData.userInfo?.name || "WhatsApp Aktif"}
                </h4>
                <p className="font-mono text-sm font-bold text-brand-700 mt-0.5">
                  +{waData.userInfo?.phone}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={handleDisconnect}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors inline-flex items-center justify-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Putuskan Sambungan WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* WAITING QR STATE */}
          {waData.status === "WAITING_QR" && waData.qrCodeDataUrl && (
            <div className="text-center space-y-4 py-2">
              <div className="p-3 bg-slate-50 border-2 border-dashed border-brand-300 rounded-3xl inline-block shadow-sm">
                <img
                  src={waData.qrCodeDataUrl}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64 mx-auto rounded-2xl"
                />
              </div>

              <div className="space-y-2 text-xs text-slate-600 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-brand-600" />
                  Cara Menautkan WhatsApp Anda:
                </p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-slate-500">
                  <li>Buka aplikasi WhatsApp di HP Anda</li>
                  <li>Ketuk menu <strong>Titik Tiga (⋮)</strong> atau <strong>Pengaturan</strong></li>
                  <li>Pilih <strong>Perangkat Tertaut (Linked Devices)</strong></li>
                  <li>Ketuk <strong>Tautkan Perangkat</strong> lalu arahkan kamera ke QR di atas</li>
                </ol>
              </div>

              <button
                onClick={handleConnect}
                disabled={loading}
                className="text-xs font-semibold text-brand-600 hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <RotateCw className="w-3.5 h-3.5" />
                Muat Ulang QR Code Baru
              </button>
            </div>
          )}

          {/* DISCONNECTED / INITIAL STATE */}
          {(waData.status === "DISCONNECTED" ||
            (waData.status === "CONNECTING" && !waData.qrCodeDataUrl)) && (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200 shadow-xs">
                <QrCode className="w-8 h-8" />
              </div>

              <div>
                <h4 className="font-bold text-base text-slate-800">
                  WhatsApp Belum Ditautkan
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Tautkan nomor WhatsApp Anda dalam 10 detik via scan QR tanpa perlu sewa server pihak ketiga.
                </p>
              </div>

              <button
                onClick={handleConnect}
                disabled={loading}
                className="w-full py-3 px-5 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md shadow-brand-500/20 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <RotateCw className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Buat QR Code & Tautkan Sekarang</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: TEST DISPATCHER & TEMPLATES (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* TEST MESSAGE SENDER */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Send className="w-4 h-4 text-brand-600" />
              Uji Coba Kirim Pesan WhatsApp
            </h3>

            {testSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Pesan berhasil terkirim ke WhatsApp tujuan!</span>
              </div>
            )}

            {testError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>{testError}</span>
              </div>
            )}

            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor WhatsApp Tujuan:
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Isi Pesan:
                </label>
                <textarea
                  rows={2}
                  required
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:border-brand-500"
                />
              </div>

              <button
                type="submit"
                disabled={sendingTest || waData.status !== "CONNECTED"}
                className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/20 transition-all inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sendingTest ? "Mengirim..." : "Kirim Pesan Uji Coba"}</span>
              </button>
            </form>
          </div>

          {/* TEMPLATE REPOSITORY */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-600" />
              Format Template Pesan Reminder & Follow-Up
            </h3>

            {/* Template 1 */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  1. Tagihan Pesanan Masuk (Order Created)
                </span>
                <button
                  onClick={() =>
                    copyTemplate(
                      "Halo Kak [Nama],\nTerima kasih telah memesan [Nama Produk] (Invoice: [No Invoice]).\nTotal tagihan: [Total Bayar]\nSilakan transfer ke Rekening [Bank]: [No Rekening] a.n. [Atas Nama].\nMohon konfirmasi jika sudah transfer ya Kak. Terima kasih!",
                      "t1"
                    )
                  }
                  className="text-[11px] text-brand-600 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedTemplate === "t1" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Salin Template
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                {`Halo Kak [Nama],
Terima kasih telah memesan [Nama Produk] (Invoice: [No Invoice]).
Total tagihan: [Total Bayar]
Silakan transfer ke Rekening [Bank]: [No Rekening] a.n. [Atas Nama].
Mohon konfirmasi jika sudah transfer ya Kak!`}
              </p>
            </div>

            {/* Template 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900">
                  2. Pengingat Follow-Up (Belum Bayar / Abandoned Cart)
                </span>
                <button
                  onClick={() =>
                    copyTemplate(
                      "Halo Kak [Nama],\nKami mengingatkan kembali untuk pesanan [Nama Produk] dengan invoice [No Invoice].\nApakah ada kendala saat melakukan transfer Kak? Stok promo diskon ini sangat terbatas dan akan segera ditutup. Hubungi kami jika butuh bantuan ya!",
                      "t2"
                    )
                  }
                  className="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedTemplate === "t2" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Salin Template
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                {`Halo Kak [Nama],
Kami mengingatkan kembali untuk pesanan [Nama Produk] dengan invoice [No Invoice].
Apakah ada kendala saat transfer Kak? Stok promo diskon ini segera ditutup. Hubungi kami jika butuh bantuan ya!`}
              </p>
            </div>

            {/* Template 3 */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  3. Konfirmasi Lunas & Kirim Link Materi Digital
                </span>
                <button
                  onClick={() =>
                    copyTemplate(
                      "Alhamdulillah, pembayaran untuk [Nama Produk] telah kami terima (LUNAS)!\n\nBerikut link akses materi digital Anda:\n👉 [Link Akses Produk]\n\nSelamat belajar dan semoga ilmunya bermanfaat Kak [Nama]!",
                      "t3"
                    )
                  }
                  className="text-[11px] text-emerald-700 font-bold hover:underline flex items-center gap-1"
                >
                  {copiedTemplate === "t3" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Salin Template
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] font-mono text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60 leading-relaxed whitespace-pre-wrap">
                {`Alhamdulillah, pembayaran untuk [Nama Produk] telah kami terima (LUNAS)!

Berikut link akses materi digital Anda:
👉 [Link Akses Produk]

Selamat belajar dan semoga ilmunya bermanfaat Kak [Nama]!`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
