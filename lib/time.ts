// פונקציות עזר טהורות לעבודה עם תאריכים ושעות (ניתנות לשימוש גם בצד הלקוח)

export const HEBREW_DAYS = [
  "ראשון",
  "שני",
  "שלישי",
  "רביעי",
  "חמישי",
  "שישי",
  "שבת",
];

export const HEBREW_MONTHS = [
  "ינואר",
  "פברואר",
  "מרץ",
  "אפריל",
  "מאי",
  "יוני",
  "יולי",
  "אוגוסט",
  "ספטמבר",
  "אוקטובר",
  "נובמבר",
  "דצמבר",
];

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// "YYYY-MM-DD" -> Date מקומי (חצות)
export function parseDateString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Date -> "YYYY-MM-DD" (לפי זמן מקומי)
export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDayOfWeek(dateStr: string): number {
  return parseDateString(dateStr).getDay();
}

export function formatDateHebrew(dateStr: string): string {
  const date = parseDateString(dateStr);
  return `יום ${HEBREW_DAYS[date.getDay()]}, ${date.getDate()} ב${
    HEBREW_MONTHS[date.getMonth()]
  }`;
}

export function formatDateShort(dateStr: string): string {
  const date = parseDateString(dateStr);
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

export function isToday(dateStr: string): boolean {
  return dateStr === toDateString(new Date());
}

export function isPastDate(dateStr: string): boolean {
  const today = toDateString(new Date());
  return dateStr < today;
}
