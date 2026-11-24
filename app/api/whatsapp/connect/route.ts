import { NextResponse } from "next/server";
import { initWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await initWhatsApp();
  return NextResponse.json(result);
}
