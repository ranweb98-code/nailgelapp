import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { SettingsManager } from "@/components/admin/SettingsManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "הגדרות · פאנל ניהול" };

export default async function AdminSettingsPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  const [hours, services, blocked, inspo] = await Promise.all([
    prisma.workingHours.findMany({ orderBy: { dayOfWeek: "asc" } }),
    prisma.service.findMany({ orderBy: { order: "asc" } }),
    prisma.blockedDate.findMany({ orderBy: { date: "asc" } }),
    prisma.inspoImage.findMany({ orderBy: { order: "asc" } }),
  ]);

  return (
    <main className="min-h-dvh pb-12">
      <AdminHeader />
      <div className="container-app pt-4">
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
