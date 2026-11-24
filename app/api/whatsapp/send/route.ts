import { NextResponse } from "next/server";
import { sendWhatsAppDirectMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Nomor WhatsApp dan pesan wajib diisi" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppDirectMessage(phone, message);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
