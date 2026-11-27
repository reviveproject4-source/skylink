import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchProductDelivery } from "@/lib/delivery";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { status } = body; // "paid" or "cancelled"

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    // Update order status
    await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
      },
    });

    // If marked as PAID:
    // 1. Log to Funnel as "paid" (3. Sudah bayar)
    // 2. Dispatch Dual Delivery (WhatsApp + Email Backup) dengan pelacakan status kegagalan
    if (status === "paid") {
      await prisma.funnelLog.create({
        data: {
          step: "paid",
          customerName: order.customerName,
          customerWhatsapp: order.customerWhatsapp,
          customerEmail: order.customerEmail,
        },
      });

      // Jalankan dual delivery WhatsApp + Email
      const deliveryResult = await dispatchProductDelivery(order.id, false);

      const refreshedOrder = await prisma.order.findUnique({
        where: { id: params.id },
        include: { product: true, bankAccount: true },
      });

      return NextResponse.json({
        ...refreshedOrder,
        deliveryResult,
      });
    }

    const refreshed = await prisma.order.findUnique({
      where: { id: params.id },
      include: { product: true, bankAccount: true },
    });

    return NextResponse.json(refreshed);
  } catch (error: any) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
