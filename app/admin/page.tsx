import Header from "@/components/Header";
import DashboardChart from "@/components/DashboardChart";
import { prisma } from "@/lib/prisma";
import { formatRupiah, formatDate } from "@/lib/utils";
import {
  TrendingUp,
  CreditCard,
  Eye,
  ShoppingCart,
  CheckCircle2,
  Package,
  Layers,
  ArrowUpRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Query 30 days revenue and stats
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  let orders: any[] = [];
  let funnelViews = 0;
  let funnelCheckouts = 0;
  let funnelPaid = 0;
  let activeLp = null;
  let failedDeliveryCount = 0;

  try {
    orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
      },
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
    });

    funnelViews = await prisma.funnelLog.count({
      where: { step: "view" },
    });
    funnelCheckouts = await prisma.funnelLog.count({
      where: { step: "checkout" },
    });
    funnelPaid = await prisma.funnelLog.count({
      where: { step: "paid" },
    });

    failedDeliveryCount = await prisma.order.count({
      where: {
        status: "paid",
        deliveryStatus: "GAGAL",
      },
    });

    activeLp = await prisma.landingPage.findFirst({
      where: { isLive: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch (e) {
    console.error("Dashboard query error:", e);
  }

  // Aggregate daily revenue for the past 30 days
  const chartMap: Record<string, { date: string; revenue: number; orders: number }> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().slice(0, 10);
    const displayLabel = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
    }).format(d);
    chartMap[dateKey] = {
      date: displayLabel,
      revenue: 0,
      orders: 0,
    };
  }

  let totalRevenue = 0;
  let totalSuccessfulOrders = 0;

  orders.forEach((o) => {
    // Count revenue for orders (both paid or checkout if personal opt A)
    const dateKey = o.createdAt.toISOString().slice(0, 10);
    if (chartMap[dateKey]) {
      chartMap[dateKey].revenue += o.totalAmount;
      chartMap[dateKey].orders += 1;
    }
    totalRevenue += o.totalAmount;
    totalSuccessfulOrders += 1;
  });

  const chartData = Object.values(chartMap);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header
        title="Halaman Utama"
        totalRevenue={totalRevenue}
        activeLpSlug={activeLp?.slug}
      />

      <main className="p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Urgent Delivery Failure Alert Banner */}
        {failedDeliveryCount > 0 && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-900">
                  Peringatan Mendesak: {failedDeliveryCount} Pesanan Gagal Terkirim ke Pembeli!
                </h3>
                <p className="text-xs text-rose-700 mt-0.5">
                  Pembeli telah melunasi pembayaran tetapi WhatsApp Sender mati/offline atau file/link belum terisi. Akses produk belum sampai ke tangan pembeli.
                </p>
              </div>
            </div>
            <Link
              href="/admin/reports"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm shrink-0"
            >
              Buka Pesanan & Kirim Ulang
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-400 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/15 relative overflow-hidden">
          <div className="relative z-10">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-100 bg-white/15 px-3 py-1 rounded-full backdrop-blur-xs">
              Statistik Pendapatan 1 Bulan Terakhir
            </span>
            <div className="mt-4 flex flex-col sm:flex-row sm:items-baseline gap-3">
              <h2 className="text-4xl font-extrabold tracking-tight">
                {formatRupiah(totalRevenue)}
              </h2>
              <span className="text-brand-100 text-sm font-medium">
                dari {totalSuccessfulOrders} transaksi pemesanan
              </span>
            </div>
            <p className="mt-2 text-sm text-brand-50/90 max-w-xl">
              Nominal total pendapatan yang tercatat dari seluruh funnel penjualan produk digital Anda selama 30 hari terakhir.
            </p>
          </div>
          {/* Subtle background glow effect */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* Funnel Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                1. Dilihat (Page View)
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {funnelViews}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pengunjung membuka LP
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-brand-600 uppercase tracking-wider">
                2. Masuk Keranjang
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {funnelCheckouts}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Pengunjung isi form checkout
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                3. Sudah Bayar
              </p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1">
                {funnelPaid}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Transaksi sukses & produk terkirim
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* 1 Month Revenue Chart */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Tren Pendapatan Harian (30 Hari)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Fluktuasi omset penjualan per hari
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              Omset Rupiah Harian
            </div>
          </div>

          <DashboardChart data={chartData} />
        </div>

        {/* Recent Orders Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Aktivitas Transaksi Terbaru
              </h3>
              <p className="text-xs text-slate-400">
                Daftar pembeli terakhir yang masuk ke sistem
              </p>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
            >
              Lihat Semua di Laporan
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">
                Belum ada transaksi dalam 30 hari terakhir
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                Begitu pembeli memesan lewat landing page atau link checkout Anda, data akan langsung muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                    <th className="pb-3 pl-2">Invoice</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Produk</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.slice(0, 5).map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-2 font-mono text-xs font-bold text-brand-700">
                        {ord.orderNumber}
                      </td>
                      <td className="py-3">
                        <p className="font-semibold text-slate-800">{ord.customerName}</p>
                        <a
                          href={`https://api.whatsapp.com/send?phone=${(() => {
                            let c = ord.customerWhatsapp.replace(/\D/g, "");
                            return c.startsWith("0") ? "62" + c.substring(1) : c;
                          })()}&text=${encodeURIComponent(
                            ord.status === "paid"
                              ? `Halo Kak ${ord.customerName}, terima kasih atas pembayaran pesanan ${ord.orderNumber}. Materi digital telah dikirimkan ke email Anda.`
                              : `Halo Kak ${ord.customerName}, kami mengonfirmasi pesanan ${ord.orderNumber} (${ord.product?.name || "Produk Digital"}). Apakah ada kendala transfer pembayaran Kak? Begitu lunas, akses materi produk digital akan langsung terkirim otomatis ke email Anda.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-emerald-600 hover:text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5"
                          title="Klik No WA: Langsung ke halaman WA tujuan & siapkan pesan"
                        >
                          <span>{ord.customerWhatsapp}</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      </td>
                      <td className="py-3 font-medium text-slate-600">
                        {ord.product?.name || "Produk Digital"}
                        {ord.bumpIncluded && (
                          <span className="ml-1.5 text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            +Bump
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {formatRupiah(ord.totalAmount)}
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 ${
                              ord.status === "paid"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-brand-50 text-brand-700 border border-brand-200"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {ord.status === "paid" ? "Lunas" : "Checkout (Pesanan Masuk)"}
                          </span>
                          {ord.status === "paid" && (
                            ord.deliveryStatus === "GAGAL" ? (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                ⚠️ Gagal Kirim
                              </span>
                            ) : ord.deliveryStatus === "TERKIRIM" ? (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                ✓ Terkirim
                              </span>
                            ) : (
                              <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                Belum Terkirim
                              </span>
                            )
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-right pr-2 text-xs text-slate-400">
                        {formatDate(ord.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
