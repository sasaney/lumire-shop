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
  const idx = db.brands.findIndex((b) => b.id === id);
  if (idx === -1) return NextResponse.json({ error: "یافت نشد." }, { status: 404 });

  db.brands[idx] = { ...db.brands[idx], ...body };
  await database.write(db);
  return NextResponse.json({ ok: true, brand: db.brands[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const db = await database.read();

  const usedByProduct = db.products.some((p) => p.brandId === id);
  if (usedByProduct) {
    return NextResponse.json(
      { error: "این برند به محصولاتی متصل است و قابل حذف نیست." },
      { status: 400 }
    );
  }

  db.brands = db.brands.filter((b) => b.id !== id);
  await database.write(db);
  return NextResponse.json({ ok: true });
}
