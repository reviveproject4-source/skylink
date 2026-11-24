import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      deliveryType,
      accessLink,
      filePath,
      description,
      priceNormal,
      pricePromo,
      discountPercent,
      promoEndDate,
      hasBumpOffer,
      bumpProductId,
      bumpCustomTitle,
      bumpCustomPrice,
    } = body;

    if (!name || priceNormal === undefined || pricePromo === undefined) {
      return NextResponse.json(
        { error: "Nama produk, harga normal, dan harga promo wajib diisi" },
        { status: 400 }
      );
    }

    const calculatedDiscount =
      discountPercent ||
      (priceNormal > pricePromo
        ? Math.round(((priceNormal - pricePromo) / priceNormal) * 100)
        : 0);

    const product = await prisma.product.create({
      data: {
        name,
        type: "digital",
        deliveryType: deliveryType || "link",
        accessLink: accessLink || null,
        filePath: filePath || null,
        description: description || "",
        priceNormal: parseFloat(priceNormal),
        pricePromo: parseFloat(pricePromo),
        discountPercent: Number(calculatedDiscount),
        promoEndDate: promoEndDate ? new Date(promoEndDate) : null,
        hasBumpOffer: Boolean(hasBumpOffer),
        bumpProductId: bumpProductId || null,
        bumpCustomTitle: bumpCustomTitle || null,
        bumpCustomPrice: bumpCustomPrice ? parseFloat(bumpCustomPrice) : null,
      },
    });

    return NextResponse.json(product);
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
