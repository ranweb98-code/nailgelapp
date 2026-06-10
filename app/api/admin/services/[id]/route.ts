import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2).optional(),
  description: z.string().trim().max(300).optional().nullable(),
  durationMin: z.number().int().min(15).max(480).optional(),
  price: z.number().int().min(0).max(100000).optional(),
  active: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }
  const updated = await prisma.service.update({
    where: { id },
    data: parsed.data,
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }
  const { id } = await params;
  // לא מוחקים פיזית אם יש תורים מקושרים - מסמנים כלא פעיל
  const count = await prisma.appointment.count({ where: { serviceId: id } });
  if (count > 0) {
    await prisma.service.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, softDeleted: true });
  }
  await prisma.service.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
