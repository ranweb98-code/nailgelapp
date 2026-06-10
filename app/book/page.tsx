import { prisma } from "@/lib/prisma";
import { BookingFlow } from "@/components/BookingFlow";
import { parseTags } from "@/lib/inspoTags";

export const dynamic = "force-dynamic";

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>;
}) {
  const { service: initialServiceId } = await searchParams;

  const [services, workingHours, blocked, inspo] = await Promise.all([
    prisma.service.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
        durationMin: true,
        price: true,
      },
    }),
    prisma.workingHours.findMany({
      where: { isOpen: true },
      select: { dayOfWeek: true },
    }),
    prisma.blockedDate.findMany({ select: { date: true } }),
    prisma.inspoImage.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
  ]);

  return (
    <BookingFlow
      services={services}
      openDaysOfWeek={workingHours.map((h) => h.dayOfWeek)}
      blockedDates={blocked.map((b) => b.date)}
      initialServiceId={initialServiceId}
      inspoImages={inspo.map((img) => ({
        id: img.id,
        src: img.src,
        label: img.label,
        tags: parseTags(img.tags),
      }))}
    />
  );
}
