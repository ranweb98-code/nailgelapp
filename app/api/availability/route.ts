import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAvailableSlots } from "@/lib/availability";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const serviceId = searchParams.get("serviceId");
  const durationParam = searchParams.get("durationMin");
  const excludeId = searchParams.get("excludeId");

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "פרמטר date חסר או לא תקין" },
      { status: 400 }
    );
  }

  let durationMin = 60;
  if (durationParam) {
    const parsed = parseInt(durationParam, 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 24 * 60) {
      return NextResponse.json(
        { error: "משך שירות לא תקין" },
        { status: 400 }
      );
    }
    durationMin = parsed;
  } else if (serviceId) {
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMin: true },
    });
    if (!service) {
      return NextResponse.json({ error: "שירות לא נמצא" }, { status: 404 });
    }
    durationMin = service.durationMin;
  }

  let excludeAppointmentId: string | undefined;
  if (excludeId) {
    if (!(await isAuthenticated())) {
      return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
    }
    excludeAppointmentId = excludeId;
  }

  const result = await getAvailableSlots(
    date,
    durationMin,
    excludeAppointmentId
  );
  return NextResponse.json(result);
}
