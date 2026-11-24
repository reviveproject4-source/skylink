import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const page = await prisma.landingPage.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        metaPixel: true,
      },
    });
    if (!page) {
      return NextResponse.json({ error: "Landing page tidak ditemukan" }, { status: 404 });
    }
    return NextResponse.json(page);
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
      title,
      slug,
      htmlContent,
      productId,
      metaPixelId,
      customPixelId,
      isLive,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (slug !== undefined) {
      data.slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-")
        .replace(/-+/g, "-");
    }
    if (htmlContent !== undefined) data.htmlContent = htmlContent;
    if (productId !== undefined) data.productId = productId || null;
    if (metaPixelId !== undefined) data.metaPixelId = metaPixelId || null;
    if (customPixelId !== undefined) data.customPixelId = customPixelId || null;
    if (isLive !== undefined) data.isLive = Boolean(isLive);

    const page = await prisma.landingPage.update({
      where: { id: params.id },
      data,
      include: {
        product: true,
        metaPixel: true,
      },
    });

    return NextResponse.json(page);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.landingPage.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
