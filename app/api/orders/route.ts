import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { sendMetaCapiEvent } from "@/lib/capi";
import { headers } from "next/headers";

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        product: true,
        bankAccount: true,
        landingPage: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      productId,
      customerName,
      customerWhatsapp,
      customerEmail,
      bumpIncluded,
      bankAccountId,
      landingPageSlug,
    } = body;

    if (!productId || !customerName || !customerWhatsapp || !customerEmail) {
      return NextResponse.json(
        { error: "Nama, No WhatsApp, dan Email wajib diisi" },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produk tidak ditemukan" },
        { status: 404 }
      );
    }

    // Calculate subtotal and bump price
    const subtotal = product.pricePromo;
    let bumpPrice = 0;
    if (bumpIncluded && product.hasBumpOffer) {
      bumpPrice = product.bumpCustomPrice || 0;
    }

    // 3 digit random unique code for bank transfer identification
    const uniqueCode = Math.floor(100 + Math.random() * 900);
    const totalAmount = subtotal + bumpPrice + uniqueCode;
    const orderNumber = generateOrderNumber();

    const headersList = headers();
    const userAgent = headersList.get("user-agent") || undefined;
    const ip = headersList.get("x-forwarded-for") || undefined;

    // Find assigned LP & Meta Pixel for this order
    let assignedLandingPage = null;
    let assignedMetaPixel = null;
    if (landingPageSlug) {
      assignedLandingPage = await prisma.landingPage.findUnique({
        where: { slug: landingPageSlug },
        include: { metaPixel: true },
      });
      if (assignedLandingPage?.metaPixel) {
        assignedMetaPixel = assignedLandingPage.metaPixel;
      }
    }

    if (!assignedMetaPixel) {
      // Fallback to first available pixel in database
      assignedMetaPixel = await prisma.metaPixel.findFirst({
        orderBy: { createdAt: "desc" },
      });
    }

    // Create order & log funnel in database transaction
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          orderNumber,
          productId: product.id,
          customerName,
          customerWhatsapp,
          customerEmail,
          bumpIncluded: Boolean(bumpIncluded),
          bumpProductId: bumpIncluded ? product.bumpProductId : null,
          subtotal,
          bumpPrice,
          uniqueCode,
          totalAmount,
          status: "checkout",
          bankAccountId: bankAccountId || null,
          landingPageId: assignedLandingPage?.id || null,
        },
        include: {
          product: true,
          bankAccount: true,
          landingPage: true,
        },
      }),
      // Log to Funnel (Checkout level)
      prisma.funnelLog.create({
        data: {
          landingPageId: assignedLandingPage?.id || null,
          step: "checkout",
          customerName,
          customerWhatsapp,
          customerEmail,
          ipAddress: ip,
          userAgent,
        },
      }),
    ]);

    // Dispatch Meta CAPI server-side event
    if (assignedMetaPixel?.pixelId && assignedMetaPixel?.capiToken) {
      sendMetaCapiEvent(
        assignedMetaPixel.pixelId,
        assignedMetaPixel.capiToken,
        assignedMetaPixel.testCode,
        {
          eventName: "Purchase",
          eventId: order.id,
          sourceUrl: headersList.get("referer") || undefined,
          user: {
            email: customerEmail,
            phone: customerWhatsapp,
            name: customerName,
            ip,
            userAgent,
          },
          customData: {
            value: totalAmount,
            currency: "IDR",
            content_name: product.name,
            order_id: orderNumber,
          },
        }
      ).catch((e) => console.error("Async Meta CAPI error:", e));
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
