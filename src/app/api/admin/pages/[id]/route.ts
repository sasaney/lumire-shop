import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const db = await database.read();
  const idx = db.pages.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  db.pages[idx] = { ...db.pages[idx], ...body };
  await database.write(db);
  return NextResponse.json({ ok: true, page: db.pages[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const db = await database.read();
  db.pages = db.pages.filter((p) => p.id !== id);
  await database.write(db);
  return NextResponse.json({ ok: true });
}
