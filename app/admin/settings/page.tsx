import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsManager } from "@/components/admin/SettingsManager";
import { ThemeSettingsSection } from "@/components/admin/ThemeSettingsSection";
import { PasswordSettingsSection } from "@/components/admin/PasswordSettingsSection";
import { getSettings } from "@/lib/settings";
import { runCleanup } from "@/lib/cleanup";
import { toDateString } from "@/lib/time";

export const dynamic = "force-dynamic";
export const metadata = { title: "הגדרות · פאנל ניהול" };

export default async function AdminSettingsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  await runCleanup().catch(() => {});

  const today = toDateString();
  const [hours, services, blocked, inspo, settings] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.blockedDate.findMany({
      where: { date: { gte: today } },
      orderBy: { date: "asc" },
    }),
    prisma.inspoImage.findMany({ orderBy: { order: "asc" } }),
    getSettings(),
  ]);

  return (
    <main className="page-bg min-h-dvh pb-12">
      <AdminHeader />
      <div className="container-app flex flex-col gap-5 pt-4">
        <ThemeSettingsSection initialTheme={settings.bgTheme} />
        <PasswordSettingsSection />
        <SettingsManager
          initialHours={hours.map((h) => ({
            dayOfWeek: h.dayOfWeek,
            isOpen: h.isOpen,
            startTime: h.startTime,
            endTime: h.endTime,
          }))}
          initialServices={services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            durationMin: s.durationMin,
            price: s.price,
            active: s.active,
          }))}
          initialBlocked={blocked.map((b) => ({
            id: b.id,
            date: b.date,
            reason: b.reason,
          }))}
          initialInspo={inspo.map((i) => ({
            id: i.id,
            src: i.src,
            label: i.label,
            tags: i.tags,
          }))}
        />
      </div>
    </main>
  );
}
