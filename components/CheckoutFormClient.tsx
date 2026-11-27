"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  ShieldCheck,
  Check,
  Clock,
  ArrowRight,
  Lock,
  Copy,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import confetti from "canvas-confetti";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  priceNormal: number;
  pricePromo: number;
  discountPercent: number;
  promoEndDate?: string | null;
  hasBumpOffer: boolean;
  bumpProductId?: string | null;
  bumpCustomTitle?: string | null;
  bumpCustomPrice?: number | null;
  accessLink?: string | null;
}

interface BumpProduct {
  id: string;
  name: string;
  description?: string | null;
  pricePromo: number;
}

interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface CheckoutFormClientProps {
  product: Product;
  bumpProduct?: BumpProduct | null;
  bankAccounts: BankAccount[];
  pixelId?: string | null;
  lpSlug?: string | null;
}

export default function CheckoutFormClient({
  product,
  bumpProduct,
  bankAccounts,
  pixelId,
  lpSlug,
}: CheckoutFormClientProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bumpIncluded, setBumpIncluded] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(
    bankAccounts[0]?.id || ""
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  // Countdown timer calculation
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!product.promoEndDate) return;

    const targetDate = new Date(product.promoEndDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        setTimeLeft(null);
        clearInterval(interval);
      } else {
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [product.promoEndDate]);

  // Fire Meta Pixel InitiateCheckout Event on Page Load
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", "InitiateCheckout", {
        content_name: product.name,
        value: product.pricePromo,
        currency: "IDR",
      });
    }
  }, [product]);

  // Calculate pricing
  const subtotal = product.pricePromo;
  const bumpPrice = bumpIncluded && product.hasBumpOffer ? (product.bumpCustomPrice || 0) : 0;
  const estimatedTotal = subtotal + bumpPrice;

  // Selected Bank Account
  const selectedBank =
    bankAccounts.find((b) => b.id === selectedBankId) || bankAccounts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerName,
          customerWhatsapp,
          customerEmail,
          bumpIncluded,
          bankAccountId: selectedBankId || null,
          landingPageSlug: lpSlug || null,
        }),
      });

      const orderData = await res.json();
      if (!res.ok) {
        throw new Error(orderData.error || "Gagal memproses pesanan");
      }

      // Option A: Trigger Client-side Purchase event immediately for high conversion tracking
      if (typeof window !== "undefined" && (window as any).fbq) {
        (window as any).fbq("track", "Purchase", {
          content_name: product.name,
          value: orderData.totalAmount,
          currency: "IDR",
          order_id: orderData.orderNumber,
        });
      }

      // Confetti burst
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setOrderSuccess(orderData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text: string, type: "bank" | "amount") => {
    navigator.clipboard.writeText(text);
    if (type === "bank") {
      setCopiedBank(true);
      setTimeout(() => setCopiedBank(false), 2000);
    } else {
      setCopiedAmount(true);
      setTimeout(() => setCopiedAmount(false), 2000);
    }
  };

  // SUCCESS / INVOICE VIEW
  if (orderSuccess) {
    const transferTotal = orderSuccess.totalAmount;
    const cleanPhone = customerWhatsapp.replace(/\D/g, "");
    const waMessage = encodeURIComponent(
      `Halo Admin, saya sudah melakukan pemesanan dengan nomor invoice ${orderSuccess.orderNumber} senilai ${formatRupiah(
        transferTotal
      )} a.n. ${customerName}. Mohon konfirmasi pembayaran saya. Terima kasih!`
    );

    return (
      <div className="max-w-xl mx-auto px-4 py-12 animate-in fade-in duration-300">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden text-center">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand-600 to-sky-500 p-8 text-white">
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h2 className="text-2xl font-black">Pesanan Berhasil Dibuat!</h2>
            <p className="text-xs text-sky-100 mt-1">
              Nomor Invoice: <strong className="font-mono">{orderSuccess.orderNumber}</strong>
            </p>
          </div>

          {/* Payment Instructions */}
          <div className="p-8 space-y-6 text-left">
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-2xl p-4 text-center">
              <p className="text-xs text-slate-500 uppercase font-semibold">
                Total yang Harus Ditransfer (Tepat Termasuk Kode Unik):
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <span className="text-3xl font-black text-brand-700">
                  {formatRupiah(transferTotal)}
                </span>
                <button
                  onClick={() => copyText(String(transferTotal), "amount")}
                  className="p-1.5 rounded-lg bg-brand-100 text-brand-700 hover:bg-brand-200 transition-colors"
                  title="Salin nominal transfer"
                >
                  {copiedAmount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                ⚠️ Pastikan transfer tepat hingga 3 digit terakhir agar terverifikasi otomatis.
              </p>
            </div>

            {/* Bank details */}
            {selectedBank && (
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase">Rekening Tujuan</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-brand-100 text-brand-700">
                    Bank {selectedBank.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Nomor Rekening:</span>
                    <span className="text-xl font-mono font-black text-slate-900">
                      {selectedBank.accountNumber}
                    </span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      a.n. {selectedBank.accountHolder}
                    </span>
                  </div>
                  <button
                    onClick={() => copyText(selectedBank.accountNumber, "bank")}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
                  >
                    {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedBank ? "Tersalin" : "Salin No. Rekening"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Notification reminder */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
              <strong>Pengiriman Produk:</strong> File/link akses produk digital akan otomatis dikirimkan ke email <strong>{customerEmail}</strong> setelah pembayaran diverifikasi.
            </div>

            {/* Confirmation CTA Buttons */}
            <div className="space-y-2.5 pt-2">
              <a
                href={`https://wa.me/6281234567890?text=${waMessage}`}
                target="_blank"
                className="w-full py-3.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Konfirmasi Pembayaran via WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // STANDARD CHECKOUT FORM VIEW
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Top Brand Header */}
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-brand-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          Checkout Aman & Terenkripsi 256-bit
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          Formulir Pemesanan Resmi
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Selesaikan pengisian data di bawah untuk mendapatkan akses instan materi digital.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Customer Form & Payment (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer Contact Box */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                  1
                </span>
                Data Diri Pemesan
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nama Lengkap <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={customerWhatsapp}
                  onChange={(e) => setCustomerWhatsapp(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Digunakan untuk konfirmasi pesanan dan update materi.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Alamat Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-hidden focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  File/link produk digital akan dikirimkan langsung ke email ini.
                </p>
              </div>
            </div>

            {/* BUMP OFFER INTERACTIVE BOX */}
            {product.hasBumpOffer && (
              <div
                onClick={() => setBumpIncluded(!bumpIncluded)}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                  bumpIncluded
                    ? "bg-emerald-50/70 border-emerald-500 shadow-md shadow-emerald-500/10"
                    : "bg-white border-dashed border-brand-400 hover:border-brand-600 bump-box-highlight"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <input
                    type="checkbox"
                    checked={bumpIncluded}
                    onChange={(e) => setBumpIncluded(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 mt-0.5 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-block mb-1.5">
                      ⚡ Penawaran Khusus (Bump Offer)
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-snug">
                      {product.bumpCustomTitle ||
                        `Ya, Tambahkan ${bumpProduct?.name || "Produk Tambahan"}!`}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Dapatkan akses materi tambahan ini sekarang hanya dengan tambahan{" "}
                      <strong className="text-emerald-700 font-bold">
                        {formatRupiah(product.bumpCustomPrice || 0)}
                      </strong>{" "}
                      (Khusus di halaman pemesanan ini).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white flex items-center justify-center text-xs">
                  2
                </span>
                Metode Pembayaran
              </h2>

              <p className="text-xs text-slate-500">
                Pilih rekening bank tujuan transfer:
              </p>

              <div className="space-y-2.5">
                {bankAccounts.map((b) => (
                  <label
                    key={b.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      selectedBankId === b.id
                        ? "bg-brand-50/50 border-brand-500 ring-1 ring-brand-500"
                        : "border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="bankSelect"
                        checked={selectedBankId === b.id}
                        onChange={() => setSelectedBankId(b.id)}
                        className="text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <span className="font-bold text-xs text-slate-800">
                          Transfer Bank {b.bankName}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-mono">
                          {b.accountNumber} - a.n. {b.accountHolder}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-brand-700 uppercase">
                      Manual Verifikasi
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-xl shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {loading
                  ? "Memproses Pesanan..."
                  : `Beli Sekarang - ${formatRupiah(estimatedTotal)}`}
              </span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <p className="text-center text-[11px] text-slate-400">
              🔒 Transaksi Anda aman. Begitu tombol diklik, invoice pembayaran akan terbit.
            </p>
          </form>
        </div>

        {/* RIGHT COLUMN: Order Summary & Countdown (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Promo Deadline Countdown */}
          {timeLeft && (
            <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-3xl p-5 shadow-lg shadow-rose-500/20 text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-2">
                <Clock className="w-4 h-4" />
                <span>Batas Waktu Promo Segera Berakhir:</span>
              </div>
              <div className="flex items-center justify-center gap-3 font-mono font-black text-2xl">
                <div className="bg-black/25 px-3 py-1.5 rounded-xl">
                  {String(timeLeft.hours).padStart(2, "0")}
                  <span className="text-[9px] block font-sans font-normal opacity-80 uppercase">Jam</span>
                </div>
                <span>:</span>
                <div className="bg-black/25 px-3 py-1.5 rounded-xl">
                  {String(timeLeft.minutes).padStart(2, "0")}
                  <span className="text-[9px] block font-sans font-normal opacity-80 uppercase">Menit</span>
                </div>
                <span>:</span>
                <div className="bg-black/25 px-3 py-1.5 rounded-xl">
                  {String(timeLeft.seconds).padStart(2, "0")}
                  <span className="text-[9px] block font-sans font-normal opacity-80 uppercase">Detik</span>
                </div>
              </div>
            </div>
          )}

          {/* Product Summary Box */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Ringkasan Pesanan
            </h3>

            <div className="border-b pb-4">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 uppercase">
                Produk Digital
              </span>
              <h4 className="font-extrabold text-base text-slate-900 mt-1">
                {product.name}
              </h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {product.description || "Akses materi digital langsung setelah pembayaran diverifikasi."}
              </p>
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Harga Normal</span>
                <span className="line-through text-slate-400">
                  {formatRupiah(product.priceNormal)}
                </span>
              </div>

              <div className="flex justify-between font-semibold text-slate-800">
                <span>Harga Promo</span>
                <span className="text-brand-600">
                  {formatRupiah(product.pricePromo)}
                </span>
              </div>

              {bumpIncluded && product.hasBumpOffer && (
                <div className="flex justify-between font-semibold text-emerald-700 bg-emerald-50/70 p-2 rounded-xl">
                  <span>+ Bump Offer</span>
                  <span>+{formatRupiah(product.bumpCustomPrice || 0)}</span>
                </div>
              )}
            </div>

            <div className="border-t pt-4 flex items-baseline justify-between">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase block">Total Bayar:</span>
                <span className="text-2xl font-black text-slate-900">
                  {formatRupiah(estimatedTotal)}
                </span>
              </div>
              {product.discountPercent > 0 && (
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-md">
                  Hemat {product.discountPercent}%
                </span>
              )}
            </div>
          </div>

          {/* Trust Guarantees */}
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200/60 space-y-3 text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Akses materi digital dikirim langsung ke email</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Dukungan konsultasi jika ada kendala akses</span>
            </div>
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Pembayaran terverifikasi aman & terpercaya</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
