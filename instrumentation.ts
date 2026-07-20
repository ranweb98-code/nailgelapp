// Next.js instrumentation hook - רץ פעם אחת בעליית השרת.
// מפעיל מתזמן שבודק תזכורות כל 5 דקות במצב פיתוח.
// בפרודקשן (Vercel) עדיף להשתמש ב-Vercel Cron שקורא ל-/api/cron/reminders
// (מוגדר ב-vercel.json).

const INTERVAL_MS = 5 * 60 * 1000; // 5 דקות

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.ENABLE_CRON !== "true") return;

  // מונע הרצה כפולה בעת hot-reload בפיתוח
  const g = globalThis as unknown as { __gelCronTimer?: NodeJS.Timeout };
  if (g.__gelCronTimer) return;

  const { runReminders } = await import("@/lib/reminders");
  const { runCleanup } = await import("@/lib/cleanup");

  const tick = async () => {
    try {
      const cleaned = await runCleanup();
      if (cleaned.appointmentsDeleted > 0 || cleaned.blockedDatesDeleted > 0) {
        console.log(
          `[cleanup] נמחקו ${cleaned.appointmentsDeleted} תורים, ${cleaned.blockedDatesDeleted} ימים חסומים`
        );
      }
      const result = await runReminders();
      if (result.sent > 0) {
        console.log(
          `[cron] נשלחו ${result.sent} תזכורות (נבדקו ${result.checked})`
        );
      }
    } catch (err) {
      console.error("[cron] שגיאה בהרצת תזכורות:", err);
    }
  };

  g.__gelCronTimer = setInterval(tick, INTERVAL_MS);
  // הרצה ראשונית קצרה אחרי עליית השרת
  setTimeout(tick, 15 * 1000);

  console.log("⏰ מתזמן התזכורות הופעל (כל 5 דקות)");
}
