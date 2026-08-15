import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ settings: db.scraperSettings });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const body = await req.json();
  const db = await database.read();
  db.scraperSettings = { ...db.scraperSettings, ...body };
  await database.write(db);
  return NextResponse.json({ ok: true, settings: db.scraperSettings });
}
