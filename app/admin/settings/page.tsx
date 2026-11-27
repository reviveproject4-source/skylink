import Header from "@/components/Header";
import SettingsClient from "@/components/SettingsClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  let settings = null;
  let totalRevenue = 0;

  try {
    settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "app_settings",
          appName: "SkyLink",
          storeName: "Revive Project",
          sellerContactPhone: "081234567890",
          sellerContactEmail: "support@reviveproject.id",
        },
      });
    }

    const orders = await prisma.order.findMany({
      select: { totalAmount: true },
    });
    totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  } catch (e) {
    console.error("Settings query error:", e);
  }

  const serializedSettings = {
    id: settings?.id || "app_settings",
    appName: settings?.appName || "SkyLink",
    storeName: settings?.storeName || "Revive Project",
    sellerContactPhone: settings?.sellerContactPhone || "081234567890",
    sellerContactEmail: settings?.sellerContactEmail || "support@reviveproject.id",
    smtpHost: settings?.smtpHost || null,
    smtpPort: settings?.smtpPort || 587,
    smtpUser: settings?.smtpUser || null,
    smtpPass: settings?.smtpPass || null,
    smtpSender: settings?.smtpSender || null,
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header title="Pengaturan Toko & Notifikasi" totalRevenue={totalRevenue} />
      <main className="p-8 max-w-7xl mx-auto w-full">
        <SettingsClient initialSettings={serializedSettings} />
      </main>
    </div>
  );
}