import AdminShell from "@/components/AdminShell";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let appName = "SkyLink";
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });
    if (settings?.appName) {
      appName = settings.appName;
    }
  } catch (e) {
    // DB might be warming up
  }

  return <AdminShell appName={appName}>{children}</AdminShell>;
}
