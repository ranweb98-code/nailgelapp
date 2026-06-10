import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

const schema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().max(300).optional().nullable(),
  durationMin: z.number().int().min(15).max(480),
  price: z.number().int().min(0).max(100000),
});

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "נתונים לא תקינים" }, { status: 400 });
  }

  const max = await prisma.service.aggregate({ _max: { order: true } });
  const service = await prisma.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      durationMin: parsed.data.durationMin,
      price: parsed.data.price,
      order: (max._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(service, { status: 201 });
}
