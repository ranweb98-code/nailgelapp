import { createRequire } from "node:module";
import { prisma } from "@/lib/prisma";

const require = createRequire(import.meta.url);

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  process.env.OWNER_EMAIL ||
  "mailto:owner@example.com";

let configured = false;

function getWebPush(): typeof import("web-push") | null {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn("[push] VAPID keys missing — push disabled");
    return null;
  }
  // require בלבד — כדי ש-webpack לא יארוז את web-push ל-Edge
  const webpush = require("web-push") as typeof import("web-push");
  if (!configured) {
    webpush.setVapidDetails(
      VAPID_SUBJECT.startsWith("mailto:")
        ? VAPID_SUBJECT
        : `mailto:${VAPID_SUBJECT}`,
      VAPID_PUBLIC,
      VAPID_PRIVATE
    );
    configured = true;
  }
  return webpush;
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC && VAPID_PRIVATE);
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

async function sendToSubscription(
  sub: SubRow,
  payload: PushPayload
): Promise<boolean> {
  const webpush = getWebPush();
  if (!webpush) return false;

  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(payload),
      { TTL: 60 * 60 * 12, urgency: "high" }
    );
    return true;
  } catch (err: unknown) {
    const status =
      err && typeof err === "object" && "statusCode" in err
        ? (err as { statusCode?: number }).statusCode
        : undefined;
    if (status === 404 || status === 410) {
      await prisma.pushSubscription
        .delete({ where: { id: sub.id } })
        .catch(() => {});
    } else {
      console.error("[push] send failed:", err);
    }
    return false;
  }
}

async function sendToMany(
  subs: SubRow[],
  payload: PushPayload
): Promise<number> {
  if (subs.length === 0) return 0;
  const results = await Promise.all(
    subs.map((s) => sendToSubscription(s, payload))
  );
  return results.filter(Boolean).length;
}

export async function sendPushToOwners(
  payload: PushPayload
): Promise<number> {
  const subs = await prisma.pushSubscription.findMany({
    where: { role: "owner" },
  });
  return sendToMany(subs, payload);
}

export async function sendPushToCustomer(
  phone: string,
  email: string,
  payload: PushPayload
): Promise<number> {
  const normalizedPhone = phone.replace(/-/g, "");
  const or: Array<{ phone?: string; email?: string }> = [
    { phone },
    { phone: normalizedPhone },
  ];
  if (email?.trim()) {
    or.push({ email: email.toLowerCase() });
  }
  const subs = await prisma.pushSubscription.findMany({
    where: {
      role: "customer",
      OR: or,
    },
  });
  return sendToMany(subs, payload);
}

export async function notifyNewAppointment(data: {
  customerName: string;
  phone: string;
  email: string;
  serviceName: string;
  date: string;
  startTime: string;
}): Promise<void> {
  await Promise.allSettled([
    sendPushToOwners({
      title: "תור חדש נקבע",
      body: `${data.customerName} · ${data.serviceName} · ${data.date} בשעה ${data.startTime}`,
      url: "/admin",
      tag: "new-appointment",
    }),
    sendPushToCustomer(data.phone, data.email, {
      title: "התור שלך נקלט!",
      body: `${data.serviceName} · ${data.date} בשעה ${data.startTime}`,
      url: "/",
      tag: "booking-confirmation",
    }),
  ]);
}

export async function notifyAppointmentStatus(data: {
  phone: string;
  email: string;
  serviceName: string;
  date: string;
  startTime: string;
  status: "confirmed" | "cancelled";
}): Promise<void> {
  const confirmed = data.status === "confirmed";
  await sendPushToCustomer(data.phone, data.email, {
    title: confirmed ? "התור אושר" : "התור בוטל",
    body: confirmed
      ? `${data.serviceName} · ${data.date} בשעה ${data.startTime}`
      : `התור ל-${data.serviceName} ב-${data.date} בוטל`,
    url: "/",
    tag: `appt-${data.status}`,
  });
}

export async function notifyCustomerReminder(data: {
  phone: string;
  email: string;
  serviceName: string;
  date: string;
  startTime: string;
}): Promise<number> {
  return sendPushToCustomer(data.phone, data.email, {
    title: "תזכורת לתור",
    body: `${data.serviceName} · ${data.date} בשעה ${data.startTime}`,
    url: "/",
    tag: "reminder",
  });
}
