import LpStudioEditor from "@/components/LpStudioEditor";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditLandingPageStudio({
  params,
}: {
  params: { id: string };
}) {
  const lp = await prisma.landingPage.findUnique({
    where: { id: params.id },
  });

  if (!lp) {
    notFound();
  }

  const products = await prisma.product.findMany({
    select: { id: true, name: true, pricePromo: true, accessLink: true, filePath: true },
    orderBy: { createdAt: "desc" },
  });

  const metaPixels = await prisma.metaPixel.findMany({
    select: { id: true, name: true, pixelId: true, capiToken: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <LpStudioEditor
      initialLp={{
        id: lp.id,
        title: lp.title,
        slug: lp.slug,
        htmlContent: lp.htmlContent,
        productId: lp.productId,
        metaPixelId: lp.metaPixelId,
        customPixelId: lp.customPixelId,
        isLive: lp.isLive,
      }}
      products={products}
      metaPixels={metaPixels}
    />
  );
}
