import nodemailer from "nodemailer";
import { prisma } from "./prisma";

interface SendProductEmailParams {
  toEmail: string;
  customerName: string;
  orderNumber: string;
  productName: string;
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
  deliveryType,
  accessLink,
  bumpIncluded,
  bumpTitle,
}: SendProductEmailParams) {
  try {
    const settings = await prisma.settings.findUnique({
      where: { id: "app_settings" },
    });

    if (!settings || !settings.smtpHost || !settings.smtpUser || !settings.smtpPass) {
      console.log(`[MAIL NOT CONFIGURED] Email to ${toEmail} for order ${orderNumber} queued locally.`);
      return { success: false, reason: "SMTP belum dikonfigurasi di menu Pengaturan" };
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

    const accessBtnHtml = accessLink
      ? `<div style="text-align: center; margin: 30px 0;">
          <a href="${accessLink}" target="_blank" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px rgba(2, 132, 199, 0.25);">
            🚀 Buka & Download Akses Produk Digital
          </a>
        </div>`
      : `<p style="color: #64748b;">Link akses akan segera dikirimkan oleh admin via WhatsApp.</p>`;

    const bumpHtml = bumpIncluded && bumpTitle
      ? `<div style="background-color: #f0fdf4; border: 1px dashed #22c55e; padding: 12px; border-radius: 8px; margin-top: 15px;">
          <strong style="color: #15803d;">Bonus / Bump Offer Termasuk:</strong>
          <p style="margin: 4px 0 0 0; color: #166534;">${bumpTitle}</p>
        </div>`
      : "";

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #0284c7, #0ea5e9); padding: 24px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px;">Pembayaran Terkonfirmasi! 🎉</h1>
          <p style="margin: 6px 0 0 0; opacity: 0.9;">Terima kasih atas pesanan Anda</p>
        </div>
        <div style="padding: 24px;">
          <p style="font-size: 16px; color: #334155;">Halo <strong>${customerName}</strong>,</p>
          <p style="color: #64748b; line-height: 1.5;">
            Pesanan Anda dengan nomor invoice <strong>${orderNumber}</strong> telah berhasil kami terima. Berikut adalah akses langsung ke produk digital Anda:
          </p>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Produk Digital</p>
            <h3 style="margin: 4px 0 0 0; color: #0f172a; font-size: 18px;">${productName}</h3>
            ${bumpHtml}
          </div>

          ${accessBtnHtml}

          <p style="font-size: 13px; color: #94a3b8; text-align: center; margin-top: 30px;">
            Simpan email ini untuk mengakses kembali materi digital Anda kapan saja. Jika ada kendala, hubungi kami via WhatsApp.
          </p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"${settings.appName || 'Customer Support'}" <${settings.smtpSender || settings.smtpUser}>`,
      to: toEmail,
      subject: `[Akses Produk Digital] ${productName} - Invoice ${orderNumber}`,
      html,
    });

    return { success: true };
  } catch (error: any) {
    console.error("Mailer error:", error);
    return { success: false, reason: error.message };
  }
}
