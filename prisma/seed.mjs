import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // 1. Initial Integration Pixel
  await prisma.integrationPixel.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      fbPixelId: "987654321012345",
      fbCapiToken: "",
      tiktokPixelId: "",
      googleAdsId: "",
    },
    update: {},
  });

  // 2. Initial Bank Accounts
  const bca = await prisma.bankAccount.create({
    data: {
      bankName: "BCA",
      accountNumber: "8830192847",
      accountHolder: "Budi Santoso",
      isActive: true,
    },
  });

  const mandiri = await prisma.bankAccount.create({
    data: {
      bankName: "Mandiri",
      accountNumber: "1370019283746",
      accountHolder: "Budi Santoso",
      isActive: true,
    },
  });

  // 3. Initial Bump Product
  const bumpProduct = await prisma.product.create({
    data: {
      name: "100+ Template Headline & Copywriting Siap Pakai",
      type: "digital",
      deliveryType: "link",
      accessLink: "https://drive.google.com/drive/folders/sample-copywriting-templates",
      description: "Kumpulan template copywriting teruji yang menghasilkan konversi tinggi untuk iklan FB & TikTok.",
      priceNormal: 99000,
      pricePromo: 49000,
      discountPercent: 51,
    },
  });

  // 4. Main Product
  const promoEnd = new Date();
  promoEnd.setDate(promoEnd.getDate() + 3);
  promoEnd.setHours(23, 59, 59, 0);

  const mainProduct = await prisma.product.create({
    data: {
      name: "Video Course: Masterclass Iklan Meta & TikTok Ads 2026",
      type: "digital",
      deliveryType: "link",
      accessLink: "https://drive.google.com/drive/folders/sample-masterclass-course",
      description: "Panduan lengkap riset audiens, setup CAPI server-side, struktur testing iklan, dan optimasi ROAS.",
      priceNormal: 299000,
      pricePromo: 99000,
      discountPercent: 67,
      promoEndDate: promoEnd,
      hasBumpOffer: true,
      bumpProductId: bumpProduct.id,
      bumpCustomTitle: "Ya! Tambahkan 100+ Template Copywriting Senilai Rp 99.000 dengan Hanya Rp 49.000",
      bumpCustomPrice: 49000,
    },
  });

  // 5. Initial Landing Page
  const sampleLpHtml = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Masterclass Iklan Meta & TikTok Ads</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-b from-sky-50 via-white to-slate-50 min-h-screen font-sans text-slate-800">
  <div class="max-w-2xl mx-auto px-6 py-16 text-center">
    <span class="inline-block px-3 py-1 bg-sky-100 text-sky-700 text-xs font-bold uppercase tracking-wider rounded-full mb-4">
      Eksklusif Digital Marketer 2026
    </span>
    <h1 class="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
      Bongkar Rahasia Scale Iklan Tanpa Takut Boncos
    </h1>
    <p class="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
      Kuasai strategi Meta CAPI, riset sudut pandang penawaran, dan formula kreatif iklan video TikTok yang mendatangkan ratusan leads per hari.
    </p>

    <!-- Pricing Box -->
    <div class="mt-8 bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-left">
      <div class="flex items-baseline justify-between border-b pb-4 mb-6">
        <div>
          <span class="text-xs font-bold text-slate-400 uppercase tracking-wider block">Harga Promo Terbatas</span>
          <span class="text-3xl font-black text-sky-600">Rp 99.000</span>
          <span class="text-sm text-slate-400 line-through ml-2">Rp 299.000</span>
        </div>
        <span class="text-xs bg-red-100 text-red-700 font-bold px-2.5 py-1 rounded-full">Hemat 67%</span>
      </div>

      <ul class="space-y-3 text-sm text-slate-700 mb-8">
        <li class="flex items-center gap-2">✅ Full 14 Modul Video HD + Studi Kasus Riil</li>
        <li class="flex items-center gap-2">✅ Template Script Iklan & Framework Testing</li>
        <li class="flex items-center gap-2">✅ Akses Selamanya & Gratis Update Materi</li>
      </ul>

      <a href="/checkout/${mainProduct.id}" class="block w-full py-4 bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-center rounded-2xl shadow-lg shadow-sky-500/25 transition-all text-lg">
        🔥 Ambil Akses Materi Sekarang
      </a>
      <p class="text-center text-xs text-slate-400 mt-2.5">🔒 Akses materi otomatis dikirimkan ke email Anda seketika</p>
    </div>
  </div>
</body>
</html>`;

  await prisma.landingPage.create({
    data: {
      title: "Masterclass Meta & TikTok Ads",
      slug: "index",
      htmlContent: sampleLpHtml,
      productId: mainProduct.id,
      isLive: true,
      viewsCount: 420,
    },
  });

  // 6. Sample 30-day orders & funnel leads
  const customerList = [
    { name: "Rizky Firmansyah", phone: "081298765432", email: "rizky@gmail.com", daysAgo: 1, bump: true },
    { name: "Anisa Putri", phone: "085612345678", email: "anisa.p@gmail.com", daysAgo: 2, bump: false },
    { name: "Deni Prasetyo", phone: "082198761234", email: "deni.pr@yahoo.com", daysAgo: 4, bump: true },
    { name: "Fajar Nugraha", phone: "081345678901", email: "fajar.nug@gmail.com", daysAgo: 6, bump: false },
    { name: "Siti Rahma", phone: "087712349876", email: "siti.rahma@gmail.com", daysAgo: 10, bump: true },
    { name: "Bayu Pratama", phone: "081987654321", email: "bayu.pratama@gmail.com", daysAgo: 15, bump: false },
    { name: "Hendro Wijaya", phone: "081234098765", email: "hendro.w@gmail.com", daysAgo: 20, bump: true },
    { name: "Maya Lestari", phone: "085712398745", email: "maya.lestari@gmail.com", daysAgo: 25, bump: false },
  ];

  for (const c of customerList) {
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - c.daysAgo);

    const bumpAmount = c.bump ? 49000 : 0;
    const unique = Math.floor(100 + Math.random() * 900);
    const total = 99000 + bumpAmount + unique;

    await prisma.order.create({
      data: {
        orderNumber: `INV-${orderDate.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`,
        productId: mainProduct.id,
        customerName: c.name,
        customerWhatsapp: c.phone,
        customerEmail: c.email,
        bumpIncluded: c.bump,
        bumpProductId: c.bump ? bumpProduct.id : null,
        subtotal: 99000,
        bumpPrice: bumpAmount,
        uniqueCode: unique,
        totalAmount: total,
        status: c.daysAgo > 3 ? "paid" : "checkout",
        bankAccountId: bca.id,
        createdAt: orderDate,
      },
    });

    await prisma.funnelLog.create({
      data: {
        step: c.daysAgo > 3 ? "paid" : "checkout",
        customerName: c.name,
        customerWhatsapp: c.phone,
        customerEmail: c.email,
        createdAt: orderDate,
      },
    });
  }

  // Sample view logs
  for (let i = 0; i < 35; i++) {
    const viewDate = new Date();
    viewDate.setDate(viewDate.getDate() - Math.floor(Math.random() * 28));
    await prisma.funnelLog.create({
      data: {
        step: "view",
        createdAt: viewDate,
      },
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
