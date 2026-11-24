import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.metaPixel.create({
    data: {
      name: "Pixel Akun Utama (Ad Account 1)",
      pixelId: "987654321012345",
      capiToken: "EAAGsampleTokenMetaCapi123456",
    },
  });
}

main().finally(() => prisma.$disconnect());
