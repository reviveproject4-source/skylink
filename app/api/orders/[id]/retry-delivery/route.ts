import { NextResponse } from "next/server";
import { dispatchProductDelivery } from "@/lib/delivery";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const result = await dispatchProductDelivery(params.id, true);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
