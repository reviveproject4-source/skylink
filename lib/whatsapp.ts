import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  WASocket,
} from "@whiskeysockets/baileys";
import QRCode from "qrcode";
import pino from "pino";
import path from "path";
import fs from "fs";

interface WhatsAppState {
  status: "DISCONNECTED" | "CONNECTING" | "WAITING_QR" | "CONNECTED";
  qrCodeDataUrl: string | null;
  userInfo: { id?: string; name?: string; phone?: string } | null;
  socket: WASocket | null;
}

const globalForWA = globalThis as unknown as {
  waState: WhatsAppState | undefined;
};

if (!globalForWA.waState) {
  globalForWA.waState = {
    status: "DISCONNECTED",
    qrCodeDataUrl: null,
    userInfo: null,
    socket: null,
  };
}

export const waState = globalForWA.waState;

const AUTH_DIR = path.join(process.cwd(), ".baileys_auth");

export async function getWhatsAppStatus() {
  return {
    status: waState.status,
    qrCodeDataUrl: waState.qrCodeDataUrl,
    userInfo: waState.userInfo,
  };
}

export async function initWhatsApp() {
  if (waState.status === "CONNECTED" && waState.socket) {
    return { success: true, message: "Sudah terhubung" };
  }

  if (waState.status === "CONNECTING" || waState.status === "WAITING_QR") {
    return { success: true, message: "Sedang menunggu pemindaian QR" };
  }

  waState.status = "CONNECTING";
  waState.qrCodeDataUrl = null;

  try {
    if (!fs.existsSync(AUTH_DIR)) {
      fs.mkdirSync(AUTH_DIR, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      browser: ["SkyLink", "Chrome", "1.0.0"],
    });

    waState.socket = sock;

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await QRCode.toDataURL(qr, {
            width: 320,
            margin: 2,
            color: {
              dark: "#0f172a",
              light: "#ffffff",
            },
          });
          waState.status = "WAITING_QR";
          waState.qrCodeDataUrl = qrDataUrl;
          console.log("[WA] QR Code generated successfully");
        } catch (e) {
          console.error("[WA] Failed to generate QR data URL:", e);
        }
      }

      if (connection === "close") {
        const shouldReconnect =
          (lastDisconnect?.error as any)?.output?.statusCode !==
          DisconnectReason.loggedOut;

        console.log(
          "[WA] Connection closed, reason:",
          (lastDisconnect?.error as any)?.message,
          "reconnecting:",
          shouldReconnect
        );

        waState.status = "DISCONNECTED";
        waState.qrCodeDataUrl = null;
        waState.userInfo = null;
        waState.socket = null;

        if (shouldReconnect) {
          setTimeout(() => {
            initWhatsApp().catch(console.error);
          }, 3000);
        }
      } else if (connection === "open") {
        console.log("[WA] Connection opened successfully!");
        waState.status = "CONNECTED";
        waState.qrCodeDataUrl = null;

        const user = sock.user;
        const phone = user?.id ? user.id.split(":")[0] : "";
        waState.userInfo = {
          id: user?.id,
          name: user?.name || "Akun WhatsApp",
          phone,
        };
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("[WA] Init error:", error);
    waState.status = "DISCONNECTED";
    waState.qrCodeDataUrl = null;
    return { success: false, error: error.message };
  }
}

export async function disconnectWhatsApp() {
  try {
    if (waState.socket) {
      await waState.socket.logout();
      waState.socket.end(new Error("User requested disconnect"));
    }
  } catch (e) {
    console.error("[WA] Logout error:", e);
  } finally {
    waState.status = "DISCONNECTED";
    waState.qrCodeDataUrl = null;
    waState.userInfo = null;
    waState.socket = null;

    if (fs.existsSync(AUTH_DIR)) {
      try {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      } catch (err) {
        console.error("[WA] Failed to clear auth directory:", err);
      }
    }
  }

  return { success: true };
}

export function formatWhatsAppJid(phone: string): string {
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  }
  return `${clean}@s.whatsapp.net`;
}

export async function sendWhatsAppDirectMessage(
  phone: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  if (waState.status !== "CONNECTED" || !waState.socket) {
    return {
      success: false,
      error: "WhatsApp belum terhubung. Silakan scan QR code di menu WhatsApp Gateway terlebih dahulu.",
    };
  }

  try {
    const jid = formatWhatsAppJid(phone);
    await waState.socket.sendMessage(jid, { text: message });
    console.log(`[WA] Message sent successfully to ${jid}`);
    return { success: true };
  } catch (error: any) {
    console.error(`[WA] Failed to send message to ${phone}:`, error);
    return { success: false, error: error.message };
  }
}
