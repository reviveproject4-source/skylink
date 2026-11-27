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
  BarChart3,
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
  let landingPages: any[] = [];
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
        landingPage: true,
      },
      orderBy: { createdAt: "desc" },
    });

    landingPages = await prisma.landingPage.findMany({
      include: {
        product: true,
        metaPixel: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const totalLpViews = landingPages.reduce((sum, lp) => sum + (lp.viewsCount || 0), 0);
    const logViews = await prisma.funnelLog.count({
      where: { step: "view" },
    });
    funnelViews = totalLpViews > 0 ? totalLpViews : logViews;
    funnelCheckouts = orders.length;
    funnelPaid = orders.filter((o) => o.status === "paid").length;

    failedDeliveryCount = await prisma.order.count({
      where: {
        status: "paid",
        deliveryStatus: "GAGAL",
      },
    });

    activeLp = landingPages.find((lp) => lp.isLive) || null;
  } catch (e) {
    console.error("Dashboard query error:", e);
  }

  // Per-Landing Page performance aggregation (30 days orders)
  const lpStatsList = landingPages.map((lp) => {
    const lpOrders = orders.filter((o) => o.landingPageId === lp.id);
    const lpPaidOrders = lpOrders.filter((o) => o.status === "paid");
    const lpRevenue = lpOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const lpPaidRevenue = lpPaidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const convRate =
      lp.viewsCount > 0 ? ((lpOrders.length / lp.viewsCount) * 100).toFixed(1) : "0.0";

    return {
      id: lp.id,
      title: lp.title,
      slug: lp.slug,
      isLive: lp.isLive,
      viewsCount: lp.viewsCount,
      productName: lp.product?.name || "Belum dipilih",
      pixelName: lp.metaPixel?.name || (lp.customPixelId ? `ID: ${lp.customPixelId}` : null),
      totalOrders: lpOrders.length,
      paidOrders: lpPaidOrders.length,
      revenue: lpRevenue,
      paidRevenue: lpPaidRevenue,
      convRate,
    };
  });

  const directOrders = orders.filter((o) => !o.landingPageId);
  const directPaidOrders = directOrders.filter((o) => o.status === "paid");
  const directRevenue = directOrders.reduce((sum, o) => sum + o.totalAmount, 0);

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

      <main className="p-4 sm:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8">
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

        {/* 1. Top Summary Banner: Total Omset/bulan */}
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
          </div>
          {/* Subtle background glow effect */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        </div>

        {/* 2. Grafik Penjualan Harian */}
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-4 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-brand-600" />
                Grafik Penjualan Harian (Tren Omset 30 Hari)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-500" />
              Omset Rupiah Harian
            </div>
          </div>

          <DashboardChart data={chartData} />
        </div>

        {/* 3. Laporan Penjualan */}
        <div className="space-y-8">
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-brand-600" />
                Laporan Penjualan & Funnel
              </h2>
            </div>
            <Link
              href="/admin/reports"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline"
            >
              Buka Semua di Laporan
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
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
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Multi-LP Ads Performance Breakdown Section */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-7">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-brand-600" />
                    Laporan Performa per Landing Page (Multi-LP Ads)
                  </h3>
                  <span className="text-[11px] font-bold bg-brand-50 text-brand-700 border border-brand-200 px-2.5 py-0.5 rounded-full">
                    {lpStatsList.length} LP Aktif
                  </span>
                </div>
              </div>
              <Link
                href="/admin/landing-pages"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 hover:underline shrink-0"
              >
                Kelola Landing Page
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {lpStatsList.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                <p className="text-sm font-semibold text-slate-600">Belum ada Landing Page dibuat</p>
                <Link
                  href="/admin/landing-pages/studio"
                  className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold text-brand-600 hover:underline"
                >
                  + Buat Landing Page Pertama
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3 pl-2">Landing Page & URL Iklan</th>
                      <th className="pb-3">Produk & Pixel</th>
                      <th className="pb-3 text-center">Views</th>
                      <th className="pb-3 text-center">Checkout</th>
                      <th className="pb-3 text-center">Lunas</th>
                      <th className="pb-3 text-right">Omset LP (30H)</th>
                      <th className="pb-3 text-right pr-2">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {lpStatsList.map((lp) => (
                      <tr key={lp.id} className="hover:bg-sky-50/40 transition-colors">
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                lp.isLive ? "bg-emerald-500" : "bg-slate-300"
                              }`}
                              title={lp.isLive ? "Live" : "Draft"}
                            />
                            <p className="font-bold text-slate-800 text-xs sm:text-sm">
                              {lp.title}
                            </p>
                          </div>
                          <a
                            href={`/lp/${lp.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded mt-1 hover:bg-sky-100 transition-colors"
                          >
                            <span>/lp/{lp.slug}</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="py-3">
                          <p className="text-xs font-medium text-slate-700 line-clamp-1 max-w-[200px]">
                            {lp.productName}
                          </p>
                          {lp.pixelName ? (
                            <span className="inline-block text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded mt-1">
                              Pixel: {lp.pixelName}
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] text-slate-400 mt-1">
                              Belum pasang Pixel
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center font-semibold text-slate-700">
                          {lp.viewsCount}
                        </td>
                        <td className="py-3 text-center">
                          <span className="font-bold text-brand-700">{lp.totalOrders}</span>
                          <span className="block text-[10px] text-slate-400">
                            CVR {lp.convRate}%
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {lp.paidOrders}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {formatRupiah(lp.revenue)}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <Link
                            href={`/admin/reports?lp=${encodeURIComponent(lp.slug)}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Filter Transaksi
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {directOrders.length > 0 && (
                      <tr className="bg-slate-50/50">
                        <td className="py-3 pl-2">
                          <p className="font-semibold text-slate-600 text-xs">
                            Direct Checkout (Tanpa LP)
                          </p>
                          <span className="inline-block text-[10px] font-mono text-slate-400 mt-0.5">
                            /checkout/[productId]
                          </span>
                        </td>
                        <td className="py-3 text-xs text-slate-400">Link Checkout Langsung</td>
                        <td className="py-3 text-center text-xs text-slate-400">-</td>
                        <td className="py-3 text-center font-bold text-slate-600">
                          {directOrders.length}
                        </td>
                        <td className="py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            {directPaidOrders.length}
                          </span>
                        </td>
                        <td className="py-3 text-right font-bold text-slate-700">
                          {formatRupiah(directRevenue)}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <Link
                            href="/admin/reports?lp=direct"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Lihat
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Recent Orders Section */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-7">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Aktivitas Transaksi Terbaru
              </h3>
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
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs uppercase font-semibold">
                    <th className="pb-3 pl-2">Invoice</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Asal Iklan / LP</th>
                    <th className="pb-3">Produk</th>
                    <th className="pb-3">Total</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-2">Waktu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orders.slice(0, 10).map((ord) => (
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
                      <td className="py-3">
                        {ord.landingPage ? (
                          <Link
                            href={`/admin/reports?lp=${encodeURIComponent(ord.landingPage.slug)}`}
                            className="inline-flex flex-col gap-0.5 group"
                            title={`Filter transaksi dari LP: ${ord.landingPage.title}`}
                          >
                            <span className="text-xs font-bold text-sky-800 group-hover:text-sky-600 line-clamp-1 max-w-[170px]">
                              {ord.landingPage.title}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-1.5 py-0.5 rounded w-fit">
                              📍 /lp/{ord.landingPage.slug}
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-50 border border-slate-200/70 px-2 py-1 rounded-md">
                            📍 Direct Checkout
                          </span>
                        )}
                      </td>
                      <td className="py-3 font-medium text-slate-600">
                        <div>
                          <span className="line-clamp-1 max-w-[180px]" title={ord.product?.name || "Produk Digital"}>
                            {ord.product?.name || "Produk Digital"}
                          </span>
                          {ord.bumpIncluded && (
                            <span className="mt-0.5 inline-block text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                              +Bump
                            </span>
                          )}
                        </div>
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
        </div>
      </main>
    </div>
  );
}
