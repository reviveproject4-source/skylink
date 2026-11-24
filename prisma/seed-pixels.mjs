import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const px1 = await prisma.metaPixel.create({
    data: {
      name: "Pixel Akun Utama (Ad Account 1)",
      pixelId: "987654321012345",
      capiToken: "EAAGsampleTokenMetaCapi123456",
    },
  });

  const px2 = await prisma.metaPixel.create({
    data: {
      name: "Pixel Campaign Promo (Ad Account 2)",
      pixelId: "123456789098765",
    },
  });

  await prisma.landingPage.updateMany({
    data: { metaPixelId: px1.id },
  });

  console.log("Meta pixels created successfully!");
}

main().finally(() => prisma.$disconnect());
