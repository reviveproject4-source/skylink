import Header from "@/components/Header";
import { prisma } from "@/lib/prisma";
import LandingPageListClient from "@/components/LandingPageListClient";

export const dynamic = "force-dynamic";

export default async function LandingPagesAdminPage() {
  let pages: any[] = [];
  let totalRevenue = 0;

  try {
    pages = await prisma.landingPage.findMany({
      include: {
        product: true,
        metaPixel: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Landing pages query error:", e);
  }

  const serializedPages = pages.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Landing Page Studio" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <LandingPageListClient initialPages={serializedPages} />
      </main>
    </div>
  );
}
