import { prisma } from "@/lib/prisma";
import { sendCustomerReminder } from "@/lib/email";
import { parseDateString, timeToMinutes } from "@/lib/time";

const REMINDER_HOURS_BEFORE = parseInt(
  process.env.REMINDER_HOURS_BEFORE || "24",
  10
);

function appointmentDateTime(date: string, startTime: string): Date {
  const d = parseDateString(date);
  const minutes = timeToMinutes(startTime);
  d.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
  return d;
}

export interface ReminderAppointment {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  serviceName: string;
  date: string;
  startTime: string;
  price: number;
  notes: string | null;
}

export interface ReminderRunResult {
  checked: number;
  sent: number;
  appointments: string[];
}

/** תורים שבחלון התזכורת ועדיין לא נשלחה להם תזכורת */
export async function findDueReminderAppointments(): Promise<{
  checked: number;
  due: ReminderAppointment[];
}> {
  const now = new Date();
  const windowEnd = new Date(
    now.getTime() + REMINDER_HOURS_BEFORE * 60 * 60 * 1000
  );

  const candidates = await prisma.appointment.findMany({
    where: {
      status: { not: "cancelled" },
      reminderSentAt: null,
    },
  });

  const due = candidates.filter((appt) => {
    const when = appointmentDateTime(appt.date, appt.startTime);
    return when > now && when <= windowEnd;
  });

  return { checked: candidates.length, due };
}

/**
 * תזכורות אימייל בלבד — בטוח לשימוש מ-instrumentation
 * (בלי ייבוא של web-push).
 */
export async function runReminders(): Promise<ReminderRunResult> {
  const { checked, due } = await findDueReminderAppointments();
  const result: ReminderRunResult = { checked, sent: 0, appointments: [] };

  for (const appt of due) {
    if (!appt.email?.trim()) continue;
    const ok = await sendCustomerReminder({
      customerName: appt.customerName,
      phone: appt.phone,
      email: appt.email,
      serviceName: appt.serviceName,
      date: appt.date,
      startTime: appt.startTime,
      price: appt.price,
      notes: appt.notes,
    });
    if (ok) {
      await prisma.appointment.update({
        where: { id: appt.id },
        data: { reminderSentAt: new Date() },
      });
      result.sent++;
      result.appointments.push(appt.id);
    }
  }

  return result;
}
