import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toDateString } from "@/lib/time";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AppointmentsBoard } from "@/components/admin/AppointmentsBoard";
import { runCleanup } from "@/lib/cleanup";

export const dynamic = "force-dynamic";
export const metadata = { title: "תורים · פאנל ניהול" };

export default async function AdminDashboardPage() {
  if (!(await isAuthenticated())) redirect("/admin/login");

  await runCleanup().catch(() => {});

  const today = toDateString(new Date());

  const [appointments, inspoImages, services, workingHours, blocked] =
    await Promise.all([
    prisma.appointment.findMany({
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
      take: 300,
    }),
    prisma.inspoImage.findMany({ select: { id: true, src: true } }),
    prisma.service.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: { id: true, name: true, durationMin: true, price: true },
    }),
    prisma.workingHours.findMany({
      where: { isOpen: true },
      select: { dayOfWeek: true },
    }),
    prisma.blockedDate.findMany({
      where: { date: { gte: today } },
      select: { date: true },
    }),
  ]);

  const inspoMap = new Map(inspoImages.map((i) => [i.id, i.src]));

  const data = appointments.map((a) => ({
    id: a.id,
    serviceName: a.serviceName,
    date: a.date,
    startTime: a.startTime,
    durationMin: a.durationMin,
    price: a.price,
    customerName: a.customerName,
    phone: a.phone,
    email: a.email,
    notes: a.notes,
    status: a.status,
    inspoSrcs: (a.inspoIds || "")
      .split(",")
      .map((id) => inspoMap.get(id.trim()))
      .filter((src): src is string => Boolean(src)),
  }));

  return (
    <main className="page-bg min-h-dvh pb-12">
      <AdminHeader />
      <div className="container-app pt-4">
        <AppointmentsBoard
          appointments={data}
          today={today}
          services={services}
          openDaysOfWeek={workingHours.map((h) => h.dayOfWeek)}
          blockedDates={blocked.map((b) => b.date)}
        />
      </div>
    </main>
  );
}
