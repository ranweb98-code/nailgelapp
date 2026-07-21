import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { inspoSrcErrorMessage, normalizeInspoSrc } from "@/lib/inspoUrl";

export const dynamic = "force-dynamic";

const schema = z.object({
  src: z.string().trim().min(1, "נדרש נתיב תמונה"),
  label: z.string().trim().max(60).optional().nullable(),
  tags: z.string().trim().max(120).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "נתונים לא תקינים" },
      { status: 400 }
    );
  }

  const src = normalizeInspoSrc(parsed.data.src);
  const srcError = inspoSrcErrorMessage(src);
  if (srcError) {
    return NextResponse.json({ error: srcError }, { status: 400 });
  }

  const max = await prisma.inspoImage.aggregate({ _max: { order: true } });
  const image = await prisma.inspoImage.create({
    data: {
      src,
      label: parsed.data.label || null,
      tags: parsed.data.tags || "",
      order: (max._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json(image, { status: 201 });
}
