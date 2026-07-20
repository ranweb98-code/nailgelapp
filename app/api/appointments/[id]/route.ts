import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { notifyAppointmentStatus } from "@/lib/push";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "סטטוס לא תקין" }, { status: 400 });
  }

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "תור לא נמצא" }, { status: 404 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  if (
    parsed.data.status !== existing.status &&
    (parsed.data.status === "confirmed" || parsed.data.status === "cancelled")
  ) {
    await notifyAppointmentStatus({
      phone: updated.phone,
      email: updated.email || "",
      serviceName: updated.serviceName,
      date: updated.date,
      startTime: updated.startTime,
      status: parsed.data.status,
    }).catch(() => {});
  }

  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }
  const { id } = await params;
  await prisma.appointment.delete({ where: { id } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
