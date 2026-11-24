import Header from "@/components/Header";
import ReportsListClient from "@/components/ReportsListClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ReportsAdminPage() {
  let orders: any[] = [];
  let funnelViews: any[] = [];
  let totalRevenue = 0;

  try {
    orders = await prisma.order.findMany({
      include: {
        product: true,
        bankAccount: true,
      },
      orderBy: { createdAt: "desc" },
    });

    funnelViews = await prisma.funnelLog.findMany({
      where: { step: "view" },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Reports query error:", e);
  }

  const serializedOrders = orders.map((o) => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
  }));

  const serializedViews = funnelViews.map((v) => ({
    ...v,
    createdAt: v.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Laporan Funnel & Pembeli" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <ReportsListClient
          orders={serializedOrders}
          funnelViews={serializedViews}
        />
      </main>
    </div>
  );
}
