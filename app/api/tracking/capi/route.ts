import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { sendMetaCapiEvent, CapiEventPayload } from "@/lib/capi";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      eventName,
      pixelId,
      capiToken,
      testCode,
      value,
      currency = "IDR",
      content_name,
      order_id,
      sourceUrl,
      landingPageId,
      user = {},
    } = body;

    if (!pixelId || !capiToken) {
      return NextResponse.json(
        { success: false, reason: "Pixel ID atau Token CAPI tidak ditemukan" },
        { status: 400 }
      );
    }

    const headersList = headers();
    const clientIp = headersList.get("x-forwarded-for") || user.ip || undefined;
    const clientUserAgent = headersList.get("user-agent") || user.userAgent || undefined;

    const payload: CapiEventPayload = {
      eventName: eventName || "InitiateCheckout",
      sourceUrl: sourceUrl || undefined,
      user: {
        email: user.email,
        phone: user.phone,
        name: user.name,
        ip: clientIp,
        userAgent: clientUserAgent,
      },
      customData: {
        value: value ? Number(value) : undefined,
        currency,
        content_name: content_name || undefined,
        order_id: order_id || undefined,
      },
    };

    // Send server-side Meta Conversions API event
    const capiResponse = await sendMetaCapiEvent(
      pixelId,
      capiToken,
      testCode || undefined,
      payload
    );

    // Also register funnel step in database if landingPageId provided
    if (landingPageId) {
      try {
        const stepName =
          eventName === "PageView" ? "view" : eventName === "InitiateCheckout" ? "checkout" : "paid";
        await prisma.funnelLog.create({
          data: {
            landingPageId,
            step: stepName,
            ipAddress: clientIp,
            userAgent: clientUserAgent,
          },
        });
      } catch (e) {
        console.error("FunnelLog recording error:", e);
      }
    }

    return NextResponse.json({ success: true, capiResponse });
  } catch (error: any) {
    console.error("Tracking CAPI Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}