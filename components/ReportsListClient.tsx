"use client";

import { useState } from "react";
import {
  Users,
  Eye,
  ShoppingCart,
  CheckCircle2,
  MessageCircle,
  Mail,
  Send,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  RotateCw,
  Clock,
  ShieldAlert,
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  bumpIncluded: boolean;
  totalAmount: number;
  status: string;
  deliveryStatus: string; // "BELUM", "TERKIRIM", "GAGAL"
  deliveryChannel?: string | null;
  deliveryError?: string | null;
  deliveryRetryCount: number;
  lastDeliveryAttempt?: string | null;
  deliveredAt?: string | null;
  createdAt: string;
  product?: {
    id: string;
    name: string;
    accessLink?: string | null;
    filePath?: string | null;
  } | null;
  landingPage?: {
    id: string;
    title: string;
    slug: string;
  } | null;
}

interface FunnelItem {
  id: string;
  step: "view" | "checkout" | "paid";
  customerName?: string | null;
  customerWhatsapp?: string | null;
  customerEmail?: string | null;
  createdAt: string;
}

interface LandingPageOption {
  id: string;
  title: string;
  slug: string;
  viewsCount: number;
}

interface ReportsListClientProps {
  orders: Order[];
  funnelViews: FunnelItem[];
  landingPages?: LandingPageOption[];
  initialLpFilter?: string;
}

export default function ReportsListClient({
  orders: initialOrders,
  funnelViews,
  landingPages = [],
  initialLpFilter = "all",
}: ReportsListClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<
    "all" | "view" | "checkout" | "paid" | "failed_delivery"
  >("all");
  const [lpFilter, setLpFilter] = useState<string>(initialLpFilter);
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [waSendingId, setWaSendingId] = useState<string | null>(null);
  const [waSuccessId, setWaSuccessId] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  // Tandai lunas & kirim produk otomatis via dual-channel
  const markAsPaid = async (orderId: string) => {
    if (!confirm("Tandai pesanan ini sebagai LUNAS dan kirim akses produk via WhatsApp & Email?"))
      return;

    setLoadingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });

      const updated = await res.json();
      if (!res.ok) throw new Error(updated.error || "Gagal mengubah status");

      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Kirim ulang produk (Retry Delivery - Poin 2)
  const retryDelivery = async (orderId: string) => {
    setRetryingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/retry-delivery`, {
        method: "POST",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Gagal mengirim ulang produk");

      if (result.order) {
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, ...result.order } : o)));
      }

      if (result.success) {
        alert("Berhasil! Akses produk telah dikirim ulang ke pembeli.");
      } else {
        alert(`Pengiriman ulang gagal: ${result.deliveryError || result.error}`);
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setRetryingId(null);
    }
  };

  // Reminder Follow-Up WA Bot (Order Pending)
  const sendWaBotReminder = async (ord: Order) => {
    setWaSendingId(ord.id);
    setWaSuccessId(null);
    try {
      const msg = `*Halo Kak ${ord.customerName}*,\nKami mengingatkan kembali untuk pesanan *${ord.product?.name || "Produk Digital"}* (Invoice: *${ord.orderNumber}*).\nTotal tagihan: *${formatRupiah(ord.totalAmount)}*.\nApakah ada kendala saat melakukan transfer Kak? Stok promo diskon ini segera berakhir. Hubungi kami jika butuh bantuan ya!`;
      
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: ord.customerWhatsapp, message: msg }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim WhatsApp");

      setWaSuccessId(ord.id);
      setTimeout(() => setWaSuccessId(null), 3000);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setWaSendingId(null);
    }
  };

  // Quick WhatsApp message generator (Manual Web)
  const openWhatsApp = (phone: string, name: string, orderNumber: string, accessLink?: string | null) => {
    let clean = phone.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);

    const message = encodeURIComponent(
      `Halo Kak ${name},\nTerima kasih telah memesan dengan nomor invoice ${orderNumber}.\n${
        accessLink
          ? `Berikut adalah link akses produk digital Anda:\n${accessLink}\n\n`
          : ""
      }Ada yang bisa kami bantu?`
    );
    window.open(`https://api.whatsapp.com/send?phone=${clean}&text=${message}`, "_blank");
  };

  // Follow-Up & Pengingat Pembayaran: Begitu klik no WA, layar langsung ke chat tujuan & pesan siap kirim
  const openWaFollowUp = (ord: Order) => {
    let clean = ord.customerWhatsapp.replace(/\D/g, "");
    if (clean.startsWith("0")) clean = "62" + clean.substring(1);

    const isPaid = ord.status === "paid";
    let messageText = "";

    if (!isPaid) {
      // Template Pengingat Pembayaran (Follow-up)
      messageText = `Halo Kak ${ord.customerName} 👋
Terima kasih telah memesan produk digital di toko kami!

Berikut ringkasan pesanan Anda:
📦 *Produk:* ${ord.product?.name || "Produk Digital"}
🧾 *No. Invoice:* ${ord.orderNumber}
💰 *Total Tagihan:* ${formatRupiah(ord.totalAmount)}

Apakah ada kendala saat melakukan transfer pembayaran Kak?
Begitu pembayaran selesai, akses materi produk digital dan bukti transaksi resmi akan langsung otomatis terkirim ke email Anda (*${ord.customerEmail}*).

Silakan balas pesan ini jika membutuhkan info rekening pembayaran atau bantuan ya Kak. Terima kasih! 🙏`;
    } else {
      // Template Konfirmasi Pengiriman Lunas
      const linkText = ord.product?.accessLink ? `\n\nLink Akses Materi Digital:\n👉 ${ord.product.accessLink}` : "";
      messageText = `Halo Kak ${ord.customerName} 👋
Pembayaran untuk pesanan ${ord.orderNumber} (*${ord.product?.name || "Produk Digital"}*) telah kami terima (*LUNAS*).
Materi digital dan invoice resmi juga sudah terkirim otomatis ke email Anda (*${ord.customerEmail}*).${linkText}

Ada yang bisa kami bantu seputar materi digital Anda?`;
    }

    const encoded = encodeURIComponent(messageText);
    const targetUrl = `https://api.whatsapp.com/send?phone=${clean}&text=${encoded}`;
    window.open(targetUrl, "_blank");
  };

  // Scope orders by selected Landing Page filter
  const lpScopedOrders = orders.filter((o) => {
    if (lpFilter === "all") return true;
    if (lpFilter === "direct") return !o.landingPage;
    return o.landingPage?.slug === lpFilter;
  });

  // Filtered orders
  const filteredOrders = lpScopedOrders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerWhatsapp.includes(search) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      (o.landingPage?.title || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.landingPage?.slug || "").toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === "all") return true;
    if (activeTab === "checkout") return o.status === "checkout";
    if (activeTab === "paid") return o.status === "paid";
    if (activeTab === "failed_delivery")
      return o.status === "paid" && o.deliveryStatus === "GAGAL";
    return false;
  });

  const selectedLpObj = landingPages.find((lp) => lp.slug === lpFilter);
  const countViews =
    lpFilter === "all"
      ? landingPages.reduce((sum, lp) => sum + (lp.viewsCount || 0), 0) || funnelViews.length
      : lpFilter === "direct"
      ? 0
      : selectedLpObj?.viewsCount || 0;
  const countCheckouts = lpScopedOrders.filter((o) => o.status === "checkout").length;
  const countPaid = lpScopedOrders.filter((o) => o.status === "paid").length;
  const countFailedDelivery = lpScopedOrders.filter(
    (o) => o.status === "paid" && o.deliveryStatus === "GAGAL"
  ).length;
  const scopedRevenue = lpScopedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      {/* POIN 1: PERINGATAN DARURAT KE PENJUAL JIKA NOTIFIKASI GAGAL */}
      {countFailedDelivery > 0 && (
        <div className="bg-red-600 text-white p-5 rounded-3xl shadow-xl shadow-red-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-sm uppercase tracking-wider">
                ⚠️ PERHATIAN PENJUAL: {countFailedDelivery} Pesanan Lunas Gagal Terkirim Produknya!
              </h3>
              <p className="text-xs text-red-100 mt-0.5 leading-relaxed">
                Pembeli sudah membayar namun pengiriman otomatis (WhatsApp/Email) gagal karena koneksi WA terputus atau link aset belum diisi. Pembeli belum menerima apa-apa!
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab("failed_delivery")}
            className="px-4 py-2 bg-white text-red-700 font-extrabold text-xs rounded-xl hover:bg-red-50 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            Lihat Pesanan Gagal ({countFailedDelivery}) &rarr;
          </button>
        </div>
      )}

      {/* Funnel Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveTab("view")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "view"
              ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/10"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-80">
              1. Sudah Melihat
            </span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black">{countViews}</p>
          <p className="text-[11px] opacity-70 mt-0.5">Pengunjung membuka LP</p>
        </button>

        <button
          onClick={() => setActiveTab("checkout")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "checkout"
              ? "bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-600/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              2. Masuk Keranjang
            </span>
            <ShoppingCart className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-2xl font-black">{countCheckouts}</p>
          <p className="text-[11px] opacity-80 mt-0.5">Menunggu transfer bayar</p>
        </button>

        <button
          onClick={() => setActiveTab("paid")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "paid"
              ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90">
              3. Sudah Bayar
            </span>
            <CheckCircle2 className="w-4 h-4 opacity-80" />
          </div>
          <p className="text-2xl font-black">{countPaid}</p>
          <p className="text-[11px] opacity-80 mt-0.5">Transaksi lunas</p>
        </button>

        {/* Tab Gagal Terkirim */}
        <button
          onClick={() => setActiveTab("failed_delivery")}
          className={`p-5 rounded-2xl border text-left transition-all ${
            activeTab === "failed_delivery"
              ? "bg-red-600 text-white border-red-600 shadow-lg shadow-red-600/20"
              : "bg-white text-slate-800 border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider opacity-90 text-red-600">
              Gagal Terkirim
            </span>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-600">{countFailedDelivery}</p>
          <p className="text-[11px] opacity-80 mt-0.5">Butuh kirim ulang</p>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        {/* Filter bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua ({lpScopedOrders.length})
            </button>
            <button
              onClick={() => setActiveTab("checkout")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "checkout"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Menunggu Bayar ({countCheckouts})
            </button>
            <button
              onClick={() => setActiveTab("paid")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "paid"
                  ? "bg-white text-emerald-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Lunas ({countPaid})
            </button>
            {countFailedDelivery > 0 && (
              <button
                onClick={() => setActiveTab("failed_delivery")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeTab === "failed_delivery"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-red-600 hover:bg-red-50"
                }`}
              >
                ⚠️ Gagal Kirim ({countFailedDelivery})
              </button>
            )}
          </div>

          {/* Right filters: LP Filter + Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Filter Asal Iklan / LP */}
            <div className="relative flex items-center">
              <Filter className="w-3.5 h-3.5 text-brand-600 absolute left-3 pointer-events-none" />
              <select
                value={lpFilter}
                onChange={(e) => setLpFilter(e.target.value)}
                className="pl-8 pr-8 py-2 rounded-xl border border-brand-200 bg-brand-50/50 text-xs font-bold text-slate-800 focus:outline-hidden focus:border-brand-500 cursor-pointer"
                title="Saring transaksi berdasarkan Landing Page / Iklan asal"
              >
                <option value="all">Semua Asal Iklan / LP ({orders.length})</option>
                {landingPages.map((lp) => {
                  const countForLp = orders.filter((o) => o.landingPage?.slug === lp.slug).length;
                  return (
                    <option key={lp.id} value={lp.slug}>
                      /lp/{lp.slug} — {lp.title} ({countForLp})
                    </option>
                  );
                })}
                <option value="direct">
                  Direct Checkout / Tanpa LP ({orders.filter((o) => !o.landingPage).length})
                </option>
              </select>
            </div>

            {/* Search box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, WA, invoice, LP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium w-full sm:w-56 focus:outline-hidden focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Selected LP Banner Summary */}
        {lpFilter !== "all" && (
          <div className="mt-4 bg-sky-50 border border-sky-200 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-sky-900">
              <span className="font-bold bg-sky-600 text-white px-2 py-0.5 rounded-md font-mono">
                {lpFilter === "direct" ? "Direct" : `/lp/${lpFilter}`}
              </span>
              <span>
                Menampilkan <strong>{lpScopedOrders.length} transaksi</strong> dengan total omset{" "}
                <strong className="text-sky-700">{formatRupiah(scopedRevenue)}</strong>
              </span>
            </div>
            <button
              onClick={() => setLpFilter("all")}
              className="text-xs font-bold text-sky-700 hover:underline self-start sm:self-auto"
            >
              Reset Filter &times;
            </button>
          </div>
        )}

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada data pesanan yang sesuai
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Data leads dan pesanan yang masuk akan otomatis terdata di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mt-3">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                  <th className="pb-3 pl-2">Customer & Invoice</th>
                  <th className="pb-3">Asal Iklan / LP</th>
                  <th className="pb-3">Produk & Bump</th>
                  <th className="pb-3">Nominal Total</th>
                  <th className="pb-3">Status Bayar</th>
                  {/* POIN 2: KOLOM STATUS PENGIRIMAN PRODUK */}
                  <th className="pb-3">Pengiriman Produk</th>
                  <th className="pb-3 text-right pr-2">Aksi & Kirim Ulang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Customer */}
                    <td className="py-3.5 pl-2">
                      <div className="font-bold text-slate-900 text-sm">
                        {ord.customerName}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                        <button
                          type="button"
                          onClick={() => openWaFollowUp(ord)}
                          className="inline-flex items-center gap-1.5 font-mono text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-lg transition-all hover:scale-105 shadow-2xs cursor-pointer"
                          title="Klik No WA: Layar langsung ke halaman WA tujuan & pesan follow-up disiapkan"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{ord.customerWhatsapp}</span>
                          <span className="text-[10px] text-emerald-600 font-medium">(Kirim WA)</span>
                        </button>
                        <span>•</span>
                        <span className="text-slate-400 truncate max-w-[150px]" title={ord.customerEmail}>
                          {ord.customerEmail}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-brand-600 block mt-0.5">
                        {ord.orderNumber}
                      </span>
                    </td>

                    {/* Asal Iklan / LP */}
                    <td className="py-3.5">
                      {ord.landingPage ? (
                        <button
                          type="button"
                          onClick={() => setLpFilter(ord.landingPage!.slug)}
                          className="text-left group"
                          title="Klik untuk saring transaksi dari LP ini"
                        >
                          <span className="block text-xs font-bold text-sky-800 group-hover:text-sky-600 max-w-[160px] truncate">
                            {ord.landingPage.title}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded mt-1">
                            📍 /lp/{ord.landingPage.slug}
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLpFilter("direct")}
                          className="inline-flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-md transition-colors"
                        >
                          📍 Direct Checkout
                        </button>
                      )}
                    </td>

                    {/* Product & Bump */}
                    <td className="py-3.5">
                      <p className="font-medium text-slate-800 text-xs max-w-[190px]">
                        {ord.product?.name || "Produk Digital"}
                      </p>
                      {/* Peringatan jika produk belum punya link atau file */}
                      {!Boolean(ord.product?.accessLink || ord.product?.filePath) && (
                        <span className="inline-block mt-0.5 text-[10px] bg-red-50 text-red-600 border border-red-300 px-2 py-0.5 rounded-md font-bold">
                          ⚠️ Produk file atau link belum terisi
                        </span>
                      )}
                      {ord.bumpIncluded && (
                        <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          + Bump Offer
                        </span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="py-3.5 font-bold text-slate-900">
                      {formatRupiah(ord.totalAmount)}
                    </td>

                    {/* Status Bayar */}
                    <td className="py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                          ord.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-brand-50 text-brand-700 border border-brand-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ord.status === "paid" ? "Sudah Bayar" : "Menunggu Bayar"}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {formatDate(ord.createdAt)}
                      </span>
                    </td>

                    {/* POIN 1 & 2: STATUS PENGIRIMAN PRODUK (DELIVERY STATUS) */}
                    <td className="py-3.5">
                      {ord.status === "paid" ? (
                        <div>
                          {ord.deliveryStatus === "TERKIRIM" ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Terkirim ({ord.deliveryChannel === "dual" ? "WA + Email" : ord.deliveryChannel === "email" ? "Email (Cadangan)" : "WhatsApp"})
                              </span>
                              {ord.deliveredAt && (
                                <span className="text-[10px] text-slate-400 block mt-0.5">
                                  {formatDate(ord.deliveredAt)}
                                </span>
                              )}
                            </div>
                          ) : ord.deliveryStatus === "GAGAL" ? (
                            <div>
                              {/* POIN 1: TULISAN MERAH GAGAL TERKIRIM */}
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Gagal Terkirim
                              </span>
                              <p className="text-[10px] text-red-600 mt-1 max-w-[200px] leading-tight font-medium" title={ord.deliveryError || ""}>
                                {ord.deliveryError || "WA Sender Offline / Gagal"}
                              </p>
                              {ord.deliveryRetryCount > 0 && (
                                <span className="text-[9px] text-slate-400 block mt-0.5">
                                  Dicoba {ord.deliveryRetryCount}x
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                              <Clock className="w-3 h-3" />
                              Belum Dikirim
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          Menunggu Bayar
                        </span>
                      )}
                    </td>

                    {/* AKSI CEPAT & TOMBOL KIRIM ULANG */}
                    <td className="py-3.5 text-right pr-2">
                      <div className="flex flex-wrap items-center justify-end gap-1.5">
                        {/* POIN 2: TOMBOL KIRIM ULANG TERCATAT (RETRY DISPATCH) */}
                        {ord.status === "paid" && (
                          <button
                            onClick={() => retryDelivery(ord.id)}
                            disabled={retryingId === ord.id}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 ${
                              ord.deliveryStatus === "GAGAL"
                                ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                                : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                            }`}
                            title="Kirim ulang materi digital ke WhatsApp dan Email pembeli (tercatat di log)"
                          >
                            <RotateCw className={`w-3 h-3 ${retryingId === ord.id ? "animate-spin" : ""}`} />
                            <span>
                              {retryingId === ord.id ? "Mengirim..." : "Kirim Ulang"}
                            </span>
                          </button>
                        )}

                        {/* WhatsApp Follow-up Pengingat Pembayaran (Layar langsung ke WA & pesan siap kirim) */}
                        {ord.status !== "paid" && (
                          <button
                            onClick={() => openWaFollowUp(ord)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
                            title="Layar langsung ke halaman nomor WA tujuan & siapkan pesan pengingat pembayaran"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Follow Up WA</span>
                          </button>
                        )}

                        {/* WhatsApp Bot Direct Reminder (Jika gateway aktif) */}
                        {ord.status !== "paid" && (
                          <button
                            onClick={() => sendWaBotReminder(ord)}
                            disabled={waSendingId === ord.id}
                            className="px-2 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors inline-flex items-center gap-1 border border-sky-200"
                            title="Kirim pesan pengingat otomatis via WhatsApp Bot Gateway"
                          >
                            <Send className="w-3 h-3 text-sky-600" />
                            <span>
                              {waSendingId === ord.id
                                ? "Mengirim..."
                                : waSuccessId === ord.id
                                ? "Terkirim! ✓"
                                : "Auto Bot"}
                            </span>
                          </button>
                        )}

                        {/* Manual Mark Paid */}
                        {ord.status !== "paid" && (
                          <button
                            onClick={() => markAsPaid(ord.id)}
                            disabled={loadingId === ord.id}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            title="Tandai lunas & jalankan pengiriman otomatis"
                          >
                            <Send className="w-3 h-3" />
                            <span>
                              {loadingId === ord.id ? "Memproses..." : "Tandai Lunas"}
                            </span>
                          </button>
                        )}

                        {/* WhatsApp Direct Chat (Manual Web) */}
                        <button
                          onClick={() =>
                            openWhatsApp(
                              ord.customerWhatsapp,
                              ord.customerName,
                              ord.orderNumber,
                              ord.product?.accessLink
                            )
                          }
                          className="px-2 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Hubungi Customer via WhatsApp Web"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Chat</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
