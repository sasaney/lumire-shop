import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const db = await database.read();
  const total = Object.values(db.pageViews).reduce((s, n) => s + n, 0);
  const pages = Object.entries(db.pageViews)
    .map(([path, views]) => ({ path, views }))
    .sort((a, b) => b.views - a.views);

  return NextResponse.json({ total, pages });
}
