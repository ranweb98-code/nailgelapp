import { prisma } from "@/lib/prisma";
import {
  getDayOfWeek,
  getNowMinutesInAppTimezone,
  isPastDate,
  isToday,
  minutesToTime,
  timeToMinutes,
  toDateString,
} from "@/lib/time";

const DEFAULT_SLOT_STEP = 30;

async function getSlotStep(): Promise<number> {
  const setting = await prisma.setting.findUnique({
    where: { key: "slotStepMin" },
  });
  const parsed = setting ? parseInt(setting.value, 10) : DEFAULT_SLOT_STEP;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SLOT_STEP;
}

export interface AvailabilityResult {
  date: string;
  open: boolean;
  reason?: string;
  slots: string[];
}

// מחשב את כל השעות הפנויות לתאריך נתון עבור שירות מסוים (לפי משך השירות)
export async function getAvailableSlots(
  dateStr: string,
  durationMin: number
): Promise<AvailabilityResult> {
  if (isPastDate(dateStr)) {
    return { date: dateStr, open: false, reason: "תאריך שעבר", slots: [] };
  }

  const blocked = await prisma.blockedDate.findUnique({
    where: { date: dateStr },
  });
  if (blocked) {
    return {
      date: dateStr,
      open: false,
      reason: blocked.reason || "יום סגור",
      slots: [],
    };
  }

  const dayOfWeek = getDayOfWeek(dateStr);
  const workingHours = await prisma.workingHours.findUnique({
    where: { dayOfWeek },
  });

  if (!workingHours || !workingHours.isOpen) {
    return { date: dateStr, open: false, reason: "סגור ביום זה", slots: [] };
  }

  const slotStep = await getSlotStep();
  const dayStart = timeToMinutes(workingHours.startTime);
  const dayEnd = timeToMinutes(workingHours.endTime);

  // תורים קיימים (לא מבוטלים) ביום זה
  const appointments = await prisma.appointment.findMany({
    where: { date: dateStr, status: { not: "cancelled" } },
    select: { startTime: true, durationMin: true },
  });

  const busy = appointments.map((a) => {
    const start = timeToMinutes(a.startTime);
    return { start, end: start + a.durationMin };
  });

  // מסנן שעות שכבר עברו אם זה היום (לפי שעון ישראל)
  const nowMinutes = getNowMinutesInAppTimezone();
  const todayFlag = isToday(dateStr);

  const slots: string[] = [];
  for (
    let start = dayStart;
    start + durationMin <= dayEnd;
    start += slotStep
  ) {
    const end = start + durationMin;

    if (todayFlag && start <= nowMinutes + 30) continue; // לפחות חצי שעה מראש

    const overlaps = busy.some((b) => start < b.end && b.start < end);
    if (!overlaps) {
      slots.push(minutesToTime(start));
    }
  }

  return { date: dateStr, open: true, slots };
}

// בודק אם סלוט ספציפי עדיין פנוי (בעת יצירת תור) - מונע double-booking
export async function isSlotAvailable(
  dateStr: string,
  startTime: string,
  durationMin: number
): Promise<boolean> {
  const result = await getAvailableSlots(dateStr, durationMin);
  return result.open && result.slots.includes(startTime);
}

// מחזיר אילו ימים בחודש פתוחים לקביעת תורים (לסימון ביומן)
export async function getOpenDaysOfWeek(): Promise<Set<number>> {
  const hours = await prisma.workingHours.findMany({ where: { isOpen: true } });
  return new Set(hours.map((h) => h.dayOfWeek));
}

export async function getBlockedDates(): Promise<Set<string>> {
  const blocked = await prisma.blockedDate.findMany({ select: { date: true } });
  return new Set(blocked.map((b) => b.date));
}

export { toDateString };
