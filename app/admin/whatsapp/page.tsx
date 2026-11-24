import Header from "@/components/Header";
import WhatsAppManagerClient from "@/components/WhatsAppManagerClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function WhatsAppAdminPage() {
  let totalRevenue = 0;
  try {
    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("WA page error:", e);
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="WhatsApp Gateway & Reminder Bot" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <WhatsAppManagerClient />
      </main>
    </div>
  );
}
