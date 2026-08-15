import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const db = await database.read();
  const idx = db.menu.findIndex((m) => m.id === id);
  if (idx === -1) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });
  db.menu[idx] = { ...db.menu[idx], ...body, label: body.label ?? db.menu[idx].label, link: body.link ?? db.menu[idx].link };
  await database.write(db);
  return NextResponse.json({ ok: true, item: db.menu[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  const { id } = await params;
  const db = await database.read();
  const hasChildren = db.menu.some((m) => m.parentId === id);
  if (hasChildren) return NextResponse.json({ error: "ابتدا زیرمجموعه‌های این آیتم را حذف کنید." }, { status: 400 });
  db.menu = db.menu.filter((m) => m.id !== id);
  await database.write(db);
  return NextResponse.json({ ok: true });
}
