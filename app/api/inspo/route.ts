import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseTags } from "@/lib/inspoTags";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tag = searchParams.get("tag");

  const images = await prisma.inspoImage.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  const result = images
    .map((img) => ({
      id: img.id,
      src: img.src,
      label: img.label,
      tags: parseTags(img.tags),
    }))
    .filter((img) => !tag || img.tags.includes(tag));

  return NextResponse.json({ images: result });
}
