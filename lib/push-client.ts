/** כלי צד-לקוח להרשמת Push (דפדפן בלבד) */

const ENDPOINT_KEY = "noir-push-endpoint";

export function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari
    window.navigator.standalone === true
  );
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.ready;
  } catch {
    return null;
  }
}

export interface SubscribeOptions {
  role?: "customer" | "owner";
  phone?: string;
  email?: string;
}

/** מבקש הרשאה, נרשם ל-Push, ושומר בשרת. מחזיר true בהצלחה. */
export async function ensurePushSubscription(
  options: SubscribeOptions = {}
): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === "undefined") {
    return { ok: false, reason: "ssr" };
  }
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "unsupported" };
  }
  if (!window.isSecureContext) {
    return { ok: false, reason: "insecure" };
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) {
    return { ok: false, reason: "no-vapid" };
  }

  const reg = await getRegistration();
  if (!reg) {
    return { ok: false, reason: "no-sw" };
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }

  const json = sub.toJSON();
  if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) {
    return { ok: false, reason: "invalid-sub" };
  }

  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
      role: options.role || "customer",
      phone: options.phone,
      email: options.email,
    }),
  });

  if (!res.ok) {
    return { ok: false, reason: "save-failed" };
  }

  try {
    localStorage.setItem(ENDPOINT_KEY, json.endpoint);
  } catch {
    /* ignore */
  }

  return { ok: true };
}

/** מעדכן טלפון/אימייל על המנוי של המכשיר הנוכחי (אחרי הזמנה) */
export async function linkPushContact(phone: string, email: string): Promise<void> {
  let endpoint: string | null = null;
  try {
    endpoint = localStorage.getItem(ENDPOINT_KEY);
  } catch {
    /* ignore */
  }

  if (!endpoint && "serviceWorker" in navigator) {
    const reg = await getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    endpoint = sub?.endpoint || null;
  }
  if (!endpoint) return;

  await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint,
      phone,
      email,
      role: "customer",
      // keys לא חובה בעדכון — השרת יעדכן רק אם קיימים
      keys: undefined,
      updateOnly: true,
    }),
  }).catch(() => {});
}
