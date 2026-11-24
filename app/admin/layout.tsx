import Sidebar from "@/components/Sidebar";
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

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar appName={appName} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
