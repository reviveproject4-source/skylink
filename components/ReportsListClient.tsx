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
  createdAt: string;
  product?: {
    id: string;
    name: string;
    accessLink?: string | null;
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

interface ReportsListClientProps {
  orders: Order[];
  funnelViews: FunnelItem[];
}

export default function ReportsListClient({
  orders: initialOrders,
  funnelViews,
}: ReportsListClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<"all" | "view" | "checkout" | "paid">(
    "all"
  );
  const [search, setSearch] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [waSendingId, setWaSendingId] = useState<string | null>(null);
  const [waSuccessId, setWaSuccessId] = useState<string | null>(null);

  const sendWaBotReminder = async (ord: Order) => {
    setWaSendingId(ord.id);
    setWaSuccessId(null);
    try {
      const msg = `Halo Kak ${ord.customerName},\nKami mengingatkan kembali untuk pesanan *${ord.product?.name || "Produk Digital"}* (Invoice: *${ord.orderNumber}*).\nTotal tagihan: *${formatRupiah(ord.totalAmount)}*.\nApakah ada kendala saat melakukan transfer Kak? Hubungi kami jika butuh bantuan ya!`;
      
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

  const markAsPaid = async (orderId: string) => {
    if (!confirm("Tandai pesanan ini sebagai LUNAS dan kirim akses produk via email?"))
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

  // Quick WhatsApp message generator
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
    window.open(`https://wa.me/${clean}?text=${message}`, "_blank");
  };

  // Filtered orders
  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerWhatsapp.includes(search) ||
      o.customerEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (activeTab === "all") return true;
    if (activeTab === "checkout") return o.status === "checkout";
    if (activeTab === "paid") return o.status === "paid";
    return false;
  });

  const countViews = funnelViews.length;
  const countCheckouts = orders.filter((o) => o.status === "checkout").length;
  const countPaid = orders.filter((o) => o.status === "paid").length;

  return (
    <div className="space-y-6">
      {/* Funnel Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
              1. Sudah Melihat (View)
            </span>
            <Eye className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-black">{countViews}</p>
          <p className="text-[11px] opacity-70 mt-0.5">Pengunjung membuka landing page</p>
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
          <p className="text-2xl font-black">{orders.length}</p>
          <p className="text-[11px] opacity-80 mt-0.5">Mengisi form & checkout</p>
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
          <p className="text-[11px] opacity-80 mt-0.5">Transaksi selesai & produk terkirim</p>
        </button>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                activeTab === "all"
                  ? "bg-white text-brand-700 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Semua Leads ({orders.length})
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
              Lunas / Selesai ({countPaid})
            </button>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, WA, email, invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium w-full sm:w-64 focus:outline-hidden focus:border-brand-500"
            />
          </div>
        </div>

        {/* Orders Table */}
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="text-sm font-semibold text-slate-600">
              Tidak ada data customer yang sesuai
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Data leads yang mengisi form pemesanan akan otomatis terdata di sini.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm mt-3">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                  <th className="pb-3 pl-2">Customer (Nama, WA, Email)</th>
                  <th className="pb-3">Produk & Bump</th>
                  <th className="pb-3">Nominal Total</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Waktu</th>
                  <th className="pb-3 text-right pr-2">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 pl-2">
                      <div className="font-bold text-slate-900 text-sm">
                        {ord.customerName}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                        <span className="font-mono text-slate-600">
                          {ord.customerWhatsapp}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400 truncate max-w-[160px]">
                          {ord.customerEmail}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-brand-600 block mt-0.5">
                        {ord.orderNumber}
                      </span>
                    </td>

                    <td className="py-3.5">
                      <p className="font-medium text-slate-800 text-xs">
                        {ord.product?.name || "Produk Digital"}
                      </p>
                      {ord.bumpIncluded && (
                        <span className="inline-block mt-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
                          + Termasuk Bump Offer
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 font-bold text-slate-900">
                      {formatRupiah(ord.totalAmount)}
                    </td>

                    <td className="py-3.5">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                          ord.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-brand-50 text-brand-700 border border-brand-200"
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {ord.status === "paid" ? "Sudah Bayar (Lunas)" : "Menunggu Bayar"}
                      </span>
                    </td>

                    <td className="py-3.5 text-xs text-slate-400">
                      {formatDate(ord.createdAt)}
                    </td>

                    <td className="py-3.5 text-right pr-2">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp Bot Direct Dispatch */}
                        {ord.status !== "paid" && (
                          <button
                            onClick={() => sendWaBotReminder(ord)}
                            disabled={waSendingId === ord.id}
                            className="px-2.5 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold transition-colors inline-flex items-center gap-1 border border-sky-200"
                            title="Kirim pesan pengingat otomatis via WhatsApp Bot"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                            <span>
                              {waSendingId === ord.id
                                ? "Mengirim..."
                                : waSuccessId === ord.id
                                ? "Terkirim! ✓"
                                : "Auto Reminder WA"}
                            </span>
                          </button>
                        )}

                        {/* WhatsApp Direct Chat */}
                        <button
                          onClick={() =>
                            openWhatsApp(
                              ord.customerWhatsapp,
                              ord.customerName,
                              ord.orderNumber,
                              ord.product?.accessLink
                            )
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors inline-flex items-center gap-1"
                          title="Hubungi Customer via WhatsApp Web"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Buka WA</span>
                        </button>

                        {/* Mark Paid Button */}
                        {ord.status !== "paid" && (
                          <button
                            onClick={() => markAsPaid(ord.id)}
                            disabled={loadingId === ord.id}
                            className="px-2.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1 disabled:opacity-50"
                            title="Tandai lunas & kirim produk ke email pembeli"
                          >
                            <Send className="w-3 h-3" />
                            <span>
                              {loadingId === ord.id ? "Memproses..." : "Tandai Lunas"}
                            </span>
                          </button>
                        )}
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
