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

export interface ReminderRunResult {
  checked: number;
  sent: number;
  appointments: string[];
}

// שולח תזכורות לתורים שמתקרבים (בתוך חלון הזמן שהוגדר) ושעדיין לא נשלחה להם תזכורת
export async function runReminders(): Promise<ReminderRunResult> {
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

  const result: ReminderRunResult = { checked: candidates.length, sent: 0, appointments: [] };

  for (const appt of candidates) {
    const when = appointmentDateTime(appt.date, appt.startTime);
    // בטווח: מעכשיו ועד חלון התזכורת
    if (when > now && when <= windowEnd) {
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
  }

  return result;
}
