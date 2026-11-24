import { NextResponse } from "next/server";
import { disconnectWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await disconnectWhatsApp();
  return NextResponse.json(result);
}
