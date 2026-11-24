import { prisma } from "@/lib/prisma";
import CheckoutFormClient from "@/components/CheckoutFormClient";
import { notFound } from "next/navigation";
import Script from "next/script";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { productId: string };
  searchParams?: { lp?: string };
}) {
  const product = await prisma.product.findUnique({
    where: { id: params.productId },
  });

  if (!product) {
    notFound();
  }

  let bumpProduct = null;
  if (product.hasBumpOffer && product.bumpProductId) {
    bumpProduct = await prisma.product.findUnique({
      where: { id: product.bumpProductId },
    });
  }

  const bankAccounts = await prisma.bankAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Determine Meta Pixel for this checkout:
  // 1. If coming from a specific Landing Page (?lp=slug), use that LP's Meta Pixel!
  // 2. Otherwise use the product's first linked LP pixel, or first available Meta Pixel.
  let assignedPixelId: string | null = null;
  let assignedCapiToken: string | null = null;
  let assignedTestCode: string | null = null;

  if (searchParams?.lp) {
    const lp = await prisma.landingPage.findUnique({
      where: { slug: searchParams.lp },
      include: { metaPixel: true },
    });
    if (lp) {
      assignedPixelId = lp.metaPixel?.pixelId || lp.customPixelId || null;
      assignedCapiToken = lp.metaPixel?.capiToken || null;
      assignedTestCode = lp.metaPixel?.testCode || null;
    }
  }

  if (!assignedPixelId) {
    const defaultMeta = await prisma.metaPixel.findFirst({
      orderBy: { createdAt: "desc" },
    });
    if (defaultMeta) {
      assignedPixelId = defaultMeta.pixelId;
      assignedCapiToken = defaultMeta.capiToken;
      assignedTestCode = defaultMeta.testCode;
    }
  }

  const serializedProduct = {
    ...product,
    promoEndDate: product.promoEndDate ? product.promoEndDate.toISOString() : null,
  };

  const serializedBump = bumpProduct
    ? {
        id: bumpProduct.id,
        name: bumpProduct.name,
        description: bumpProduct.description,
        pricePromo: bumpProduct.pricePromo,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Meta Pixel Script Injection (Pure Facebook Ads) */}
      {assignedPixelId && (
        <Script
          id="fb-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${assignedPixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      )}

      <CheckoutFormClient
        product={serializedProduct}
        bumpProduct={serializedBump}
        bankAccounts={bankAccounts}
        pixelId={assignedPixelId}
      />
    </div>
  );
}
