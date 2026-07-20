import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  endpoint: z.string().url(),
  keys: z
    .object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    })
    .optional(),
  role: z.enum(["customer", "owner"]).optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().optional().or(z.literal("")),
  updateOnly: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
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
  let role = data.role || "customer";

  if (role === "owner") {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
  } else {
    role = "customer";
  }

  const existing = await prisma.pushSubscription.findUnique({
    where: { endpoint: data.endpoint },
  });

  if (data.updateOnly) {
    if (!existing) {
      return NextResponse.json({ error: "מנוי לא נמצא" }, { status: 404 });
    }
    await prisma.pushSubscription.update({
      where: { endpoint: data.endpoint },
      data: {
        phone: data.phone || existing.phone,
        email: data.email ? data.email.toLowerCase() : existing.email,
        role: role === "owner" ? "owner" : existing.role,
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (!data.keys) {
    return NextResponse.json({ error: "חסרים מפתחות" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: {
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      role,
      phone: data.phone || null,
      email: data.email ? data.email.toLowerCase() : null,
    },
    update: {
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      role,
      phone: data.phone !== undefined ? data.phone || null : undefined,
      email:
        data.email !== undefined
          ? data.email
            ? data.email.toLowerCase()
            : null
          : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const endpoint =
    body && typeof body === "object" && "endpoint" in body
      ? String((body as { endpoint: unknown }).endpoint)
      : "";

  if (!endpoint) {
    return NextResponse.json({ error: "חסר endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription
    .delete({ where: { endpoint } })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}
