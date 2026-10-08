import { appendFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const line = `${JSON.stringify(body)}\n`;
    await appendFile(join(process.cwd(), "debug-46ac43.log"), line);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
