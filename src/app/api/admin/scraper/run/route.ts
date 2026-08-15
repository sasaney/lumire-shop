import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { runScraperOnDb } from "@/lib/scraper-run";

export async function POST() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const db = await database.read();
  const summary = await runScraperOnDb(db);
  await database.write(db);

  return NextResponse.json({ ok: true, summary });
}
