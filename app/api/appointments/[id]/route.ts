import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { canBookAt } from "@/lib/availability";
import { notifyAppointmentStatus, notifyAppointmentRescheduled } from "@/lib/push";
import { sendCustomerRescheduled } from "@/lib/email";

export const dynamic = "force-dynamic";

const patchSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  })
  .superRefine((data, ctx) => {
    const hasDate = Boolean(data.date);
    const hasTime = Boolean(data.startTime);
    if (hasDate !== hasTime) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "יש לשלוח תאריך ושעה יחד",
      });
    }
    if (!data.status && !hasDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "אין מה לעדכן",
      });
    }
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
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const existing = await prisma.appointment.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "תור לא נמצא" }, { status: 404 });
  }

  const { status, date, startTime } = parsed.data;

  if (date && startTime) {
    if (existing.status === "cancelled") {
      return NextResponse.json(
        { error: "לא ניתן להזיז תור שבוטל" },
        { status: 409 }
      );
    }

    const moved =
      date !== existing.date || startTime !== existing.startTime;

    if (moved) {
      const bookable = await canBookAt(
        date,
        startTime,
        existing.durationMin,
        existing.id
      );
      if (!bookable.ok) {
        return NextResponse.json({ error: bookable.reason }, { status: 409 });
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: {
          date,
          startTime,
          reminderSentAt: null,
          ...(status ? { status } : {}),
        },
      });

      await Promise.allSettled([
        updated.email
          ? sendCustomerRescheduled({
              customerName: updated.customerName,
              phone: updated.phone,
              email: updated.email,
              serviceName: updated.serviceName,
              date: updated.date,
              startTime: updated.startTime,
              price: updated.price,
              notes: updated.notes,
              oldDate: existing.date,
              oldStartTime: existing.startTime,
            })
          : Promise.resolve(true),
        notifyAppointmentRescheduled({
          phone: updated.phone,
          email: updated.email || "",
          serviceName: updated.serviceName,
          date: updated.date,
          startTime: updated.startTime,
        }),
      ]);

      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        date: updated.date,
        startTime: updated.startTime,
      });
    }
  }

  if (!status) {
    return NextResponse.json({
      id: existing.id,
      status: existing.status,
      date: existing.date,
      startTime: existing.startTime,
    });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
  });

  if (
    status !== existing.status &&
    (status === "confirmed" || status === "cancelled")
  ) {
    await notifyAppointmentStatus({
      phone: updated.phone,
      email: updated.email || "",
      serviceName: updated.serviceName,
      date: updated.date,
      startTime: updated.startTime,
      status,
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
