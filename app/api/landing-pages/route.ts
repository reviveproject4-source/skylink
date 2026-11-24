import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const pages = await prisma.landingPage.findMany({
      include: {
        product: true,
        metaPixel: true,
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(pages);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
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

    if (!title || !slug) {
      return NextResponse.json(
        { error: "Judul LP dan Slug URL wajib diisi" },
        { status: 400 }
      );
    }

    const cleanSlug = slug
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-");

    const existing = await prisma.landingPage.findUnique({
      where: { slug: cleanSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Slug "${cleanSlug}" sudah digunakan, silakan gunakan slug lain` },
        { status: 400 }
      );
    }

    const defaultHtml =
      htmlContent ||
      `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-800 font-sans">
  <div class="max-w-2xl mx-auto px-4 py-16 text-center">
    <span class="inline-block px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
      Penawaran Terbatas
    </span>
    <h1 class="text-4xl font-black text-slate-900 tracking-tight leading-tight">
      ${title}
    </h1>
    <p class="mt-4 text-slate-600 text-lg">
      Materi eksklusif produk digital untuk meningkatkan hasil Anda secara signifikan.
    </p>

    <div class="mt-8 p-6 bg-white rounded-3xl shadow-xl border border-slate-100">
      <p class="text-slate-400 line-through text-sm">Rp 199.000</p>
      <p class="text-3xl font-black text-sky-600 mt-1">Rp 99.000</p>
      
      <div class="mt-6">
        <a href="/checkout/${productId || ''}?lp=${cleanSlug}" class="block w-full py-4 px-6 bg-sky-600 hover:bg-sky-700 text-white font-extrabold rounded-2xl shadow-lg shadow-sky-500/25 transition-all text-center">
          👉 Beli Sekarang (Akses Instan)
        </a>
      </div>
    </div>
  </div>
</body>
</html>`;

    const page = await prisma.landingPage.create({
      data: {
        title,
        slug: cleanSlug,
        htmlContent: defaultHtml,
        productId: productId || null,
        metaPixelId: metaPixelId || null,
        customPixelId: customPixelId || null,
        isLive: isLive !== undefined ? Boolean(isLive) : true,
      },
      include: {
        product: true,
        metaPixel: true,
      },
    });

    return NextResponse.json(page);
  } catch (error: any) {
    console.error("Create LP error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
