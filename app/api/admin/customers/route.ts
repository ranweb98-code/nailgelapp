import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "@/lib/auth";
import { digitsIsraeliPhone } from "@/lib/phone";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") || "").trim().toLowerCase();
  const qDigits = digitsIsraeliPhone(q);

  const rows = await prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
    take: 400,
    select: {
      customerName: true,
      phone: true,
      email: true,
    },
  });

  const seen = new Set<string>();
  const customers: { name: string; phone: string; email: string | null }[] = [];

  for (const row of rows) {
    const key = digitsIsraeliPhone(row.phone) || row.phone;
    if (seen.has(key)) continue;
    seen.add(key);

    if (q) {
      const nameMatch = row.customerName.toLowerCase().includes(q);
      const phoneMatch =
        row.phone.includes(q) ||
        (qDigits.length >= 3 && digitsIsraeliPhone(row.phone).includes(qDigits));
      if (!nameMatch && !phoneMatch) continue;
    }

    customers.push({
      name: row.customerName,
      phone: row.phone,
      email: row.email,
    });
    if (customers.length >= 30) break;
  }

  return NextResponse.json({ customers });
}
