import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "gel_admin_session";
const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";
const ENV_PASSWORD = process.env.ADMIN_PASSWORD || "gel1234";

async function getAdminPassword(): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({
      where: { key: "adminPassword" },
    });
    if (row?.value) return row.value;
  } catch {
    /* DB לא זמין — נופלים ל-env */
  }
  return ENV_PASSWORD;
}

async function makeToken(): Promise<string> {
  const password = await getAdminPassword();
  return createHmac("sha256", SECRET).update(password).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function verifyPassword(password: string): Promise<boolean> {
  const expected = await getAdminPassword();
  return safeEqual(password, expected);
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, await makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 יום
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return safeEqual(token, await makeToken());
}

export async function changeAdminPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!(await verifyPassword(currentPassword))) {
    return { ok: false, error: "הסיסמה הנוכחית שגויה" };
  }
  const next = newPassword.trim();
  if (next.length < 4) {
    return { ok: false, error: "הסיסמה החדשה חייבת להכיל לפחות 4 תווים" };
  }
  if (next.length > 72) {
    return { ok: false, error: "הסיסמה ארוכה מדי" };
  }
  if (await verifyPassword(next)) {
    return { ok: false, error: "הסיסמה החדשה זהה לנוכחית" };
  }

  await prisma.setting.upsert({
    where: { key: "adminPassword" },
    create: { key: "adminPassword", value: next },
    update: { value: next },
  });

  // מרעננים את ה-session עם הטוקן החדש
  await createSession();
  return { ok: true };
}
