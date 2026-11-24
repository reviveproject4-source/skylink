import LpStudioEditor from "@/components/LpStudioEditor";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function NewLandingPageStudio() {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, pricePromo: true },
    orderBy: { createdAt: "desc" },
  });

  const metaPixels = await prisma.metaPixel.findMany({
    select: { id: true, name: true, pixelId: true, capiToken: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <LpStudioEditor
      products={products}
      metaPixels={metaPixels}
    />
  );
}
