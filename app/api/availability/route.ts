import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "פרמטר date חסר או לא תקין" },
      { status: 400 }
    );
  }

  let durationMin = 60;
  if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMin: true },
    });
    if (!service) {
      return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
    }
    durationMin = service.durationMin;
  }

  const result = await getAvailableSlots(date, durationMin);
  return NextResponse.json(result);
}
