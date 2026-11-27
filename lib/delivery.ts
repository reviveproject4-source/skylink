import { prisma } from "./prisma";
import { formatRupiah } from "./utils";
import { sendWhatsAppDirectMessage } from "./whatsapp";
import { sendDigitalProductEmail } from "./mailer";

export async function dispatchProductDelivery(orderId: string, isRetry = false) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { product: true },
    });

    if (!order) {
      return { success: false, reason: "NOT_FOUND", error: "Pesanan tidak ditemukan" };
    }

    // 1. Validasi Aset Produk (Poin 5: Cegah pembeli bayar tanpa menerima produk)
    const hasAsset = Boolean(order.product.accessLink || order.product.filePath);
    if (!hasAsset) {
      const errorMsg = `ASET_KOSONG: Produk "${order.product.name}" belum memiliki file upload atau link akses dari penjual. Segera isi link produk di menu Produk Digital.`;
      
      await prisma.order.update({
        where: { id: orderId },
        data: {
          deliveryStatus: "GAGAL",
          deliveryError: errorMsg,
          lastDeliveryAttempt: new Date(),
          deliveryRetryCount: isRetry ? { increment: 1 } : undefined,
        },
      });

      return {
        success: false,
        reason: "ASET_KOSONG",
        error: errorMsg,
      };
    }

    // 2. Ambil Profil Toko & Kontak Penjual (Poin 4: Identitas jelas di pesan)
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    const storeName = settings?.storeName || "Revive Project";
    const contactPhone = settings?.sellerContactPhone || "";
    let cleanContact = contactPhone.replace(/\D/g, "");
    if (cleanContact.startsWith("0")) cleanContact = "62" + cleanContact.substring(1);

    const accessUrl = order.product.accessLink || `https://domainanda.com/download/${order.orderNumber}`;

    let bumpInfo = "";
    let bumpTitle: string | null = null;
    if (order.bumpIncluded && order.bumpProductId) {
      const bumpProduct = await prisma.product.findUnique({
        where: { id: order.bumpProductId },
      });
      if (bumpProduct) {
        bumpTitle = bumpProduct.name;
        bumpInfo = `• Bonus / Bump: *${bumpProduct.name}*\n`;
      }
    }

    // Format Pesan WhatsApp dengan Identitas Toko & Kontak CS
    const waMessage = `*📦 [${storeName} - Akses Produk Digital]*

Halo Kak *${order.customerName}*,
Terima kasih, pembayaran untuk pesanan Anda telah kami terima (*LUNAS*)! 🎉

*Rincian Pesanan:*
• No. Invoice: *${order.orderNumber}*
• Produk: *${order.product.name}*
${bumpInfo}• Total Bayar: *${formatRupiah(order.totalAmount)}*

*🔗 Link Akses Materi Digital Anda:*
👉 ${accessUrl}

_(Simpan link ini untuk mengakses materi Anda kapan saja)_

────────────────────────
Ada pertanyaan seputar materi? Hubungi Customer Support kami:
🏪 Toko: *${storeName}*
${cleanContact ? `📱 WhatsApp CS: https://wa.me/${cleanContact}` : ""}

Selamat belajar dan semoga ilmunya bermanfaat!`;

    // 3. Eksekusi Pengiriman WhatsApp
    const waResult = await sendWhatsAppDirectMessage(order.customerWhatsapp, waMessage);

    // 4. Eksekusi Pengiriman Email Sebagai Cadangan WA (Poin 3: Dual-Channel Delivery)
    const emailResult = await sendDigitalProductEmail({
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

    // 5. Evaluasi Status Pengiriman (Poin 1 & 2: Penanda status terkirim, gagal, dan rincian kegagalan)
    let newDeliveryStatus = "GAGAL";
    let channel = "none";
    let deliveryError: string | null = null;

    if (waResult.success && emailResult.success) {
      newDeliveryStatus = "TERKIRIM";
      channel = "dual";
    } else if (waResult.success && !emailResult.success) {
      newDeliveryStatus = "TERKIRIM";
      channel = "whatsapp";
      deliveryError = `WA Terkirim | Email gagal: ${emailResult.reason || "SMTP belum aktif"}`;
    } else if (!waResult.success && emailResult.success) {
      newDeliveryStatus = "TERKIRIM";
      channel = "email";
      deliveryError = `WA Gagal (${waResult.error || "WA Sender Offline"}), Link berhasil terkirim via Email Cadangan`;
    } else {
      newDeliveryStatus = "GAGAL";
      channel = "none";
      deliveryError = `WA Gagal: ${waResult.error || "WhatsApp master sender tidak terhubung"}${
        emailResult.reason ? ` | Email: ${emailResult.reason}` : ""
      }`;
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryStatus: newDeliveryStatus,
        deliveryChannel: channel,
        deliveryError,
        deliveredAt: newDeliveryStatus === "TERKIRIM" ? new Date() : undefined,
        lastDeliveryAttempt: new Date(),
        deliveryRetryCount: isRetry ? { increment: 1 } : undefined,
      },
    });

    return {
      success: newDeliveryStatus === "TERKIRIM",
      deliveryStatus: newDeliveryStatus,
      channel,
      deliveryError,
      waSuccess: waResult.success,
      emailSuccess: emailResult.success,
      order: updatedOrder,
    };
  } catch (err: any) {
    console.error("dispatchProductDelivery error:", err);
    return { success: false, error: err.message };
  }
}
