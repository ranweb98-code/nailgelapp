import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCustomerReminder } from "@/lib/email";
import { notifyCustomerReminder } from "@/lib/push";
import { findDueReminderAppointments } from "@/lib/reminders";
import { runCleanup } from "@/lib/cleanup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handle() {
  const cleanup = await runCleanup().catch(() => ({
    appointmentsDeleted: 0,
    blockedDatesDeleted: 0,
  }));

  const { checked, due } = await findDueReminderAppointments();
  let sent = 0;
  const appointments: string[] = [];

  for (const appt of due) {
    const hasEmail = Boolean(appt.email?.trim());

    const emailOk = hasEmail
      ? await sendCustomerReminder({
          customerName: appt.customerName,
          phone: appt.phone,
          email: appt.email!,
          serviceName: appt.serviceName,
          date: appt.date,
          startTime: appt.startTime,
          price: appt.price,
          notes: appt.notes,
        })
      : false;

    const pushCount = await notifyCustomerReminder({
      phone: appt.phone,
      email: appt.email || "",
      serviceName: appt.serviceName,
      date: appt.date,
      startTime: appt.startTime,
    });

    const delivered = emailOk || pushCount > 0;

    if (delivered) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
      appointments.push(appt.id);
    } else if (!hasEmail) {
      // אין מייל ואין מנוי Push — מסמנים כדי לא לנסות שוב כל שעה
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });
    }
    // יש מייל אבל שליחה נכשלה — לא מסמנים, ינסו שוב בריצה הבאה
  }

  return { ok: true, checked, sent, appointments, cleanup };
}

export async function GET() {
  return NextResponse.json(await handle());
}

export async function POST() {
  return NextResponse.json(await handle());
}
