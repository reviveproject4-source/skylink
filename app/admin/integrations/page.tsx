import Header from "@/components/Header";
import IntegrationsClient from "@/components/IntegrationsClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function IntegrationsAdminPage() {
  let pixels: any[] = [];
  let totalRevenue = 0;

  try {
    pixels = await prisma.metaPixel.findMany({
      include: {
        _count: {
          select: { landingPages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Integrations query error:", e);
  }

  const serializedPixels = pixels.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Daftar Meta Pixel & CAPI" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <IntegrationsClient initialPixels={serializedPixels} />
      </main>
    </div>
  );
}
