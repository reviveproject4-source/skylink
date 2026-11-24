import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function PublicLandingPageRoute({
  params,
}: {
  params: { slug: string };
}) {
  const lp = await prisma.landingPage.findUnique({
    where: { slug: params.slug },
    include: { product: true },
  });

  if (!lp || !lp.isLive) {
    notFound();
  }

  // Record visitor funnel (view)
  try {
    const headersList = headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const ip = headersList.get("x-forwarded-for") || undefined;

    await prisma.$transaction([
      prisma.landingPage.update({
        where: { id: lp.id },
        data: { viewsCount: { increment: 1 } },
      }),
      prisma.funnelLog.create({
        data: {
          landingPageId: lp.id,
          step: "view",
          ipAddress: ip,
          userAgent,
        },
      }),
    ]);
  } catch (err) {
    console.error("Funnel view log error:", err);
  }

  // Return raw HTML directly to the browser
  return (
    <div
      dangerouslySetInnerHTML={{ __html: lp.htmlContent }}
      className="w-full min-h-screen"
    />
  );
}
