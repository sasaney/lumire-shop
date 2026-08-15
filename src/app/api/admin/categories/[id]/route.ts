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
  const idx = db.categories.findIndex((c) => c.id === id);
  if (idx === -1) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });

  db.categories[idx] = { ...db.categories[idx], ...body };
  await database.write(db);
  return NextResponse.json({ ok: true, category: db.categories[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const db = await database.read();

  const hasChildren = db.categories.some((c) => c.parentId === id);
  if (hasChildren) {
    return NextResponse.json(
      { error: "ابتدا زیردسته‌های این دسته‌بندی را حذف کنید." },
      { status: 400 }
    );
  }
  const usedByProduct = db.products.some((p) => p.categoryIds.includes(id));
  if (usedByProduct) {
    return NextResponse.json(
      { error: "این دسته‌بندی به محصولاتی متصل است و قابل حذف نیست." },
      { status: 400 }
    );
  }

  db.categories = db.categories.filter((c) => c.id !== id);
  await database.write(db);
  return NextResponse.json({ ok: true });
}
