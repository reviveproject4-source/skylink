import nodemailer from "nodemailer";
import { prisma } from "./prisma";
import { formatRupiah } from "./utils";

interface SendProductEmailParams {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  productName: string;
  totalAmount?: number;
  deliveryType: string;
  accessLink?: string | null;
  filePath?: string | null;
  bumpIncluded?: boolean;
  bumpTitle?: string | null;
}

export async function sendDigitalProductEmail({
  toEmail,
  customerName,
  orderNumber,
  productName,
  totalAmount = 0,
  deliveryType,
  accessLink,
  filePath,
  bumpIncluded,
  bumpTitle,
}: SendProductEmailParams) {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    const storeName = settings?.storeName || "Revive Project";
    const contactPhone = settings?.sellerContactPhone || "";
    let cleanContact = contactPhone.replace(/\D/g, "");
    if (cleanContact.startsWith("0")) cleanContact = "62" + cleanContact.substring(1);
    const contactEmail = settings?.sellerContactEmail || "support@reviveproject.id";
    const defaultSender = settings?.smtpSender || settings?.sellerContactEmail || "no-reply@reviveproject.id";

    // Direct access link URL
    const finalAccessUrl = accessLink?.trim() || filePath?.trim() || "";

    const accessBtnHtml = finalAccessUrl
      ? `<div style="text-align: center; margin: 32px 0;">
          <a href="${finalAccessUrl}" target="_blank" style="background: linear-gradient(135deg, #0284c7, #0ea5e9); color: #ffffff; padding: 16px 36px; font-size: 16px; font-weight: 800; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 6px 14px rgba(2, 132, 199, 0.35); letter-spacing: 0.3px;">
            🚀 BUKA & DOWNLOAD MATERI DIGITAL
          </a>
          <p style="margin-top: 10px; font-size: 12px; color: #64748b;">
            Link Akses Langsung: <a href="${finalAccessUrl}" style="color: #0284c7; word-break: break-all;">${finalAccessUrl}</a>
          </p>
        </div>`
      : `<div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; padding: 14px; text-align: center; color: #dc2626; font-size: 13px; font-weight: bold; margin: 20px 0;">
          ⚠️ Link materi digital sedang disiapkan oleh admin. Hubungi CS untuk bantuan akses langsung.
        </div>`;

    const bumpHtml = bumpIncluded && bumpTitle
      ? `<div style="background-color: #f0fdf4; border: 1px dashed #22c55e; padding: 14px; border-radius: 10px; margin-top: 16px;">
          <strong style="color: #15803d; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Bonus / Bump Offer Termasuk:</strong>
          <p style="margin: 4px 0 0 0; color: #166534; font-size: 15px; font-weight: bold;">${bumpTitle}</p>
        </div>`
      : "";

    const html = `
      <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
        {/* Header Ucapan Terima Kasih */}
        <div style="background: linear-gradient(135deg, #0284c7 0%, #0ea5e9 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
          <span style="background: rgba(255,255,255,0.2); padding: 4px 14px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; display: inline-block; margin-bottom: 12px;">
            ${storeName} - Konfirmasi Pembayaran
          </span>
          <h1 style="margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">
            Terima Kasih Atas Pembayaran Anda! 🎉
          </h1>
          <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">
            Pembayaran LUNAS & Akses Produk Digital Anda Siap Digunakan
          </p>
        </div>

        {/* Content Body */}
        <div style="padding: 28px 24px; color: #334155;">
          <p style="font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
            Halo Kak <strong>${customerName}</strong>,
          </p>
          <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
            Terima kasih banyak telah melakukan pembayaran untuk pesanan Anda di <strong>${storeName}</strong>. Pembayaran Anda untuk nomor invoice <strong>${orderNumber}</strong> telah kami terima dan terverifikasi secara resmi (<strong>LUNAS</strong>).
          </p>

          {/* Rincian Pesanan Box */}
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
              Rincian Transaksi
            </p>
            <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">No. Invoice:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; font-family: monospace; color: #0284c7;">${orderNumber}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Produk Digital:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #0f172a;">${productName}</td>
              </tr>
              ${totalAmount > 0 ? `
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Bayar:</td>
                <td style="padding: 6px 0; text-align: right; font-weight: 900; color: #059669; font-size: 16px;">${formatRupiah(totalAmount)}</td>
              </tr>` : ""}
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Status:</td>
                <td style="padding: 6px 0; text-align: right;">
                  <span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 6px;">
                    ✓ LUNAS
                  </span>
                </td>
              </tr>
            </table>
            ${bumpHtml}
          </div>

          {/* Akses Produk CTA */}
          <div style="text-align: center; margin-top: 10px;">
            <p style="font-size: 14px; font-weight: bold; color: #1e293b; margin-bottom: 4px;">
              Silakan klik tombol di bawah untuk mengakses materi digital Anda:
            </p>
            ${accessBtnHtml}
          </div>

          <p style="font-size: 13px; color: #64748b; line-height: 1.5; text-align: center; margin: 20px 0 0 0; background: #f1f5f9; padding: 12px; border-radius: 8px;">
            💡 <em>Simpan email ini sebagai bukti pembelian resmi dan untuk mengakses kembali link materi digital Anda kapan saja.</em>
          </p>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0 20px 0;" />

          {/* Customer Support Info */}
          <div style="font-size: 13px; color: #64748b; text-align: center; line-height: 1.6;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #334155;">
              Butuh bantuan atau panduan akses materi?
            </p>
            <p style="margin: 0;">
              WhatsApp CS: <a href="https://wa.me/${cleanContact || '6281234567890'}" style="color: #0284c7; font-weight: bold; text-decoration: none;">${contactPhone || '081234567890'}</a>
              &nbsp;|&nbsp;
              Email: <a href="mailto:${contactEmail}" style="color: #0284c7; text-decoration: none;">${contactEmail}</a>
            </p>
            <p style="margin: 16px 0 0 0; font-size: 12px; color: #94a3b8;">
              &copy; ${new Date().getFullYear()} ${storeName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `;

    // Check if SMTP is configured
    if (!settings?.smtpHost || !settings?.smtpUser || !settings?.smtpPass) {
      console.log(`[DEFAULT EMAIL DISPATCH LOG] To: ${toEmail} | Order: ${orderNumber} | Link: ${finalAccessUrl} (Menunggu konfigurasi SMTP di Pengaturan)`);
      return {
        success: true,
        queued: true,
        reason: "Email pengiriman produk & ucapan terima kasih telah dibuat (SMTP belum diisi di Pengaturan, log tersimpan)",
      };
    }

    const transporter = nodemailer.createTransport({
      host: settings.smtpHost,
      port: settings.smtpPort || 587,
      secure: (settings.smtpPort || 587) === 465,
      auth: {
        user: settings.smtpUser,
        pass: settings.smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"${storeName}" <${defaultSender}>`,
      to: toEmail,
      subject: `[Terima Kasih Atas Pembayaran] Akses Materi ${productName} (Invoice: ${orderNumber})`,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Mailer error:", error);
    return { success: false, reason: error.message };
  }
}
