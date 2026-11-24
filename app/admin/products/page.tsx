import Header from "@/components/Header";
import ProductListClient from "@/components/ProductListClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage() {
  let products: any[] = [];
  let totalRevenue = 0;

  try {
    products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Products query error:", e);
  }

  const serializedProducts = products.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    promoEndDate: p.promoEndDate ? p.promoEndDate.toISOString() : null,
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Produk Digital" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <ProductListClient initialProducts={serializedProducts} />
      </main>
    </div>
  );
}
