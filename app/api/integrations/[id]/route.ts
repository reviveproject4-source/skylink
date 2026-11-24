import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { name, pixelId, capiToken, testCode } = body;

    const pixel = await prisma.metaPixel.update({
      where: { id: params.id },
      data: {
        name,
        pixelId: pixelId?.trim(),
        capiToken: capiToken?.trim() || null,
        testCode: testCode?.trim() || null,
      },
    });

    return NextResponse.json(pixel);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.metaPixel.delete({
      where: { id: params.id },
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
