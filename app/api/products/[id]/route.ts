import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
    });
    if (!product) {
      return NextResponse.json({ error: "Produk tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const calculatedDiscount =
      discountPercent !== undefined
        ? discountPercent
        : priceNormal > pricePromo
        ? Math.round(((priceNormal - pricePromo) / priceNormal) * 100)
        : 0;

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        deliveryType,
        accessLink,
        filePath,
        description,
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
