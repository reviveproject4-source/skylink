import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pixels = await prisma.metaPixel.findMany({
      include: {
        _count: {
          select: { landingPages: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(pixels);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, pixelId, capiToken, testCode } = body;

    if (!name || !pixelId) {
      return NextResponse.json(
        { error: "Nama Akun/Label dan Pixel ID wajib diisi" },
        { status: 400 }
      );
    }

    const pixel = await prisma.metaPixel.create({
      data: {
        name,
        pixelId: pixelId.trim(),
        capiToken: capiToken?.trim() || null,
        testCode: testCode?.trim() || null,
      },
    });

    return NextResponse.json(pixel);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
