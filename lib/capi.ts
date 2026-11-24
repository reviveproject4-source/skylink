import crypto from "crypto";

function sha256(str: string): string {
  if (!str) return "";
  return crypto.createHash("sha256").update(str.trim().toLowerCase()).digest("hex");
}

function normalizePhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/\D/g, "");
  if (clean.startsWith("0")) {
    clean = "62" + clean.substring(1);
  }
  return clean;
}

export interface CapiEventPayload {
  eventName: "PageView" | "InitiateCheckout" | "Purchase";
  eventId?: string;
  sourceUrl?: string;
  user: {
    email?: string;
    phone?: string;
    name?: string;
    ip?: string;
    userAgent?: string;
  };
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    order_id?: string;
  };
}

export async function sendMetaCapiEvent(
  pixelId: string,
  accessToken: string,
  testCode: string | null | undefined,
  event: CapiEventPayload
) {
  if (!pixelId || !accessToken) return null;

  try {
    const userData: Record<string, any> = {
      client_ip_address: event.user.ip || undefined,
      client_user_agent: event.user.userAgent || undefined,
    };

    if (event.user.email) {
      userData.em = [sha256(event.user.email)];
    }
    if (event.user.phone) {
      userData.ph = [sha256(normalizePhone(event.user.phone))];
    }
    if (event.user.name) {
      const parts = event.user.name.trim().split(" ");
      userData.fn = [sha256(parts[0])];
      if (parts.length > 1) {
        userData.ln = [sha256(parts.slice(1).join(" "))];
      }
    }

    const payload: Record<string, any> = {
      data: [
        {
          event_name: event.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event.eventId,
          event_source_url: event.sourceUrl || "https://local-app.com",
          action_source: "website",
          user_data: userData,
          custom_data: event.customData
            ? {
                value: event.customData.value,
                currency: event.customData.currency || "IDR",
                content_name: event.customData.content_name,
                order_id: event.customData.order_id,
              }
            : undefined,
        },
      ],
    };

    if (testCode) {
      payload.test_event_code = testCode;
    }

    const res = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = await res.json();
    return result;
  } catch (error) {
    console.error("Meta CAPI Error:", error);
    return null;
  }
}
