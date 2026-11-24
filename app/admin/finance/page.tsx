import Header from "@/components/Header";
import FinanceBankListClient from "@/components/FinanceBankListClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function FinanceAdminPage() {
  let banks: any[] = [];
  let totalRevenue = 0;

  try {
    banks = await prisma.bankAccount.findMany({
      orderBy: { createdAt: "desc" },
    });

    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Finance query error:", e);
  }

  const serializedBanks = banks.map((b) => ({
    ...b,
    createdAt: b.createdAt.toISOString(),
  }));

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Keuangan & Rekening Bank" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <FinanceBankListClient initialBanks={serializedBanks} />
      </main>
    </div>
  );
}
