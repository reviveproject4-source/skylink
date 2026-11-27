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

    // 1. Validasi Aset Produk (Cegah pembeli bayar tanpa menerima produk)
    const hasAsset = Boolean(order.product.accessLink?.trim() || order.product.filePath?.trim());
    if (!hasAsset) {
      const errorMsg = `⚠️ Peringatan: Produk file atau link belum terisi! Produk "${order.product.name}" belum memiliki file upload atau link akses. Segera lengkapi link di menu Produk Digital.`;
      
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

    // 2. Ambil Profil Toko & Kontak Penjual (Identitas jelas di pesan)
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
Terima kasih banyak, pembayaran untuk pesanan Anda telah kami terima (*LUNAS*)! 🎉
Akses materi digital dan invoice resmi juga telah kami kirimkan ke email Anda: *${order.customerEmail}*.

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

    // 3. Eksekusi Pengiriman Email Default (Semua produk dikirim via email adalah default)
    const emailResult = await sendDigitalProductEmail({
      toEmail: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      productName: order.product.name,
      totalAmount: order.totalAmount,
      deliveryType: order.product.deliveryType,
      accessLink: order.product.accessLink,
      filePath: order.product.filePath,
      bumpIncluded: order.bumpIncluded,
      bumpTitle,
    });

    // 4. Eksekusi Pengiriman WhatsApp (Saluran komplementer)
    const waResult = await sendWhatsAppDirectMessage(order.customerWhatsapp, waMessage);

    // 5. Evaluasi Status Pengiriman (Email adalah Default)
    let newDeliveryStatus = "GAGAL";
    let channel = "email";
    let deliveryError: string | null = null;

    if (emailResult.success && waResult.success) {
      newDeliveryStatus = "TERKIRIM";
      channel = "dual";
      deliveryError = null;
    } else if (emailResult.success && !waResult.success) {
      // Email sukses (Default delivery terpenuhi), WA sender offline/gagal
      newDeliveryStatus = "TERKIRIM";
      channel = "email";
      deliveryError = `Terkirim via Email (Default). Notifikasi WA gagal: ${waResult.error || "WA Sender Offline"}`;
    } else if (!emailResult.success && waResult.success) {
      // Email gagal, tapi WA sukses terkirim
      newDeliveryStatus = "TERKIRIM";
      channel = "whatsapp";
      deliveryError = `Terkirim via WhatsApp. Email gagal: ${emailResult.reason || "SMTP error"}`;
    } else {
      // Dua-duanya gagal
      newDeliveryStatus = "GAGAL";
      channel = "none";
      deliveryError = `Email Gagal: ${emailResult.reason || "SMTP belum siap"} | WA Gagal: ${waResult.error || "WA Sender Offline"}`;
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
