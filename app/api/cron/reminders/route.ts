import { NextResponse } from "next/server";
import { runReminders } from "@/lib/reminders";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await runReminders();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST() {
  const result = await runReminders();
  return NextResponse.json({ ok: true, ...result });
}
