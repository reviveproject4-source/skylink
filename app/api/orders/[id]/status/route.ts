import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDigitalProductEmail } from "@/lib/mailer";

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
    const updatedOrder = await prisma.order.update({
      where: { id: params.id },
      data: {
        status,
        deliveredAt: status === "paid" ? new Date() : undefined,
      },
      include: { product: true },
    });

    // If marked as PAID:
    // 1. Log to Funnel as "paid" (3. Sudah bayar)
    // 2. Send digital product email automatically!
    if (status === "paid") {
      await prisma.funnelLog.create({
        data: {
          step: "paid",
          customerName: order.customerName,
          customerWhatsapp: order.customerWhatsapp,
          customerEmail: order.customerEmail,
        },
      });

      // Send email
      let bumpTitle: string | null = null;
      if (order.bumpIncluded && order.bumpProductId) {
        const bumpProduct = await prisma.product.findUnique({
          where: { id: order.bumpProductId },
        });
        bumpTitle = bumpProduct?.name || null;
      }

      await sendDigitalProductEmail({
        toEmail: order.customerEmail,
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        productName: order.product.name,
        deliveryType: order.product.deliveryType,
        accessLink: order.product.accessLink,
        filePath: order.product.filePath,
        bumpIncluded: order.bumpIncluded,
        bumpTitle,
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (error: any) {
    console.error("Update order status error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
