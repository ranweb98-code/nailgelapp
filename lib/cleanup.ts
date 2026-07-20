import { prisma } from "@/lib/prisma";
import { toDateString } from "@/lib/time";

export interface CleanupResult {
  appointmentsDeleted: number;
  blockedDatesDeleted: number;
}

/**
 * מחיקת תורים מימים שעברו (מהיום הקודם ומטה)
 * ומחיקת ימים חסומים שכבר עברו.
 */
export async function runCleanup(): Promise<CleanupResult> {
  const today = toDateString();

  const [appointments, blocked] = await Promise.all([
    prisma.appointment.deleteMany({
      where: { date: { lt: today } },
    }),
    prisma.blockedDate.deleteMany({
      where: { date: { lt: today } },
    }),
  ]);

  return {
    appointmentsDeleted: appointments.count,
    blockedDatesDeleted: blocked.count,
  };
}
