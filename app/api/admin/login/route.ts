import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  if (!body.password || !verifyPassword(body.password)) {
    return NextResponse.json({ error: "סיסמה שגויה" }, { status: 401 });
  }

  await createSession();
  return NextResponse.json({ ok: true });
}
