import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { normalizeBgTheme } from "@/lib/settings";

export const dynamic = "force-dynamic";

const schema = z.object({
  bgTheme: z.enum(["light", "dark"]).optional(),
  businessName: z.string().trim().min(1).max(80).optional(),
  businessTagline: z.string().trim().max(120).optional(),
  phone: z.string().trim().min(7).max(20).optional(),
  address: z.string().trim().min(1).max(200).optional(),
});

export async function PATCH(req: NextRequest) {
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
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const data = parsed.data;
  const entries: { key: string; value: string }[] = [];

  if (data.bgTheme !== undefined) {
    entries.push({ key: "bgTheme", value: normalizeBgTheme(data.bgTheme) });
  }
  if (data.businessName !== undefined) {
    entries.push({ key: "businessName", value: data.businessName });
  }
  if (data.businessTagline !== undefined) {
    entries.push({ key: "businessTagline", value: data.businessTagline });
  }
  if (data.phone !== undefined) {
    entries.push({ key: "phone", value: data.phone });
  }
  if (data.address !== undefined) {
    entries.push({ key: "address", value: data.address });
  }

  if (entries.length === 0) {
    return NextResponse.json({ error: "אין מה לעדכן" }, { status: 400 });
  }

  await Promise.all(
    entries.map((e) =>
      prisma.setting.upsert({
        where: { key: e.key },
        create: e,
        update: { value: e.value },
      })
    )
  );

  return NextResponse.json({ ok: true });
}
