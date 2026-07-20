import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isAuthenticated, changeAdminPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  currentPassword: z.string().min(1, "יש להזין סיסמה נוכחית"),
  newPassword: z.string().min(4, "סיסמה חדשה קצרה מדי").max(72),
  confirmPassword: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const { currentPassword, newPassword, confirmPassword } = parsed.data;
  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "אימות הסיסמה החדשה אינו תואם" },
      { status: 400 }
    );
  }

  const result = await changeAdminPassword(currentPassword, newPassword);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
