import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: "app_settings",
          appName: "SkyLink",
          storeName: "Revive Project",
          sellerContactPhone: "081234567890",
          sellerContactEmail: "support@reviveproject.id",
        },
      });
    }
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      appName,
      storeName,
      sellerContactPhone,
      sellerContactEmail,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPass,
      smtpSender,
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "app_settings" },
      create: {
        id: "app_settings",
        appName: appName || "SkyLink",
        storeName: storeName || "Revive Project",
        sellerContactPhone: sellerContactPhone || null,
        sellerContactEmail: sellerContactEmail || null,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort) : null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        smtpSender: smtpSender || null,
      },
      update: {
        appName: appName || undefined,
        storeName: storeName || undefined,
        sellerContactPhone: sellerContactPhone || undefined,
        sellerContactEmail: sellerContactEmail || undefined,
        smtpHost: smtpHost || null,
        smtpPort: smtpPort ? parseInt(smtpPort) : null,
        smtpUser: smtpUser || null,
        smtpPass: smtpPass || null,
        smtpSender: smtpSender || null,
      },
    });

    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
