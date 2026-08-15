import { NextResponse } from "next/server";
import { database } from "@/lib/db";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ categories: db.categories.filter((c) => c.isActive !== false) });
}
