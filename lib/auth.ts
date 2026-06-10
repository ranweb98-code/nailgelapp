import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gel_admin_session";
const SECRET = process.env.AUTH_SECRET || "fallback-dev-secret";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "gel1234";

// יוצר טוקן חתום על בסיס הסיסמה - נשמר ב-cookie
function makeToken(): string {
  return createHmac("sha256", SECRET).update(ADMIN_PASSWORD).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifyPassword(password: string): boolean {
  return safeEqual(password, ADMIN_PASSWORD);
}

export async function createSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, makeToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // שבוע
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
  return safeEqual(token, makeToken());
}
