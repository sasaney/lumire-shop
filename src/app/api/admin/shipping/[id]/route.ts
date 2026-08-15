import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { FreightType } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const db = await database.read();
  const idx = (db.shippingMethods || []).findIndex((m) => m.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "روش ارسال یافت نشد." }, { status: 404 });
  }
  const cur = db.shippingMethods[idx];
  const freightType: FreightType =
    body.freightType === "COLLECT"
      ? "COLLECT"
      : body.freightType === "PREPAID"
        ? "PREPAID"
        : cur.freightType;

  db.shippingMethods[idx] = {
    ...cur,
    name: body.name !== undefined ? String(body.name).trim() : cur.name,
    description:
      body.description !== undefined ? String(body.description).trim() : cur.description,
    cost: body.cost !== undefined ? Math.max(0, Number(body.cost) || 0) : cur.cost,
    freightType,
    estimatedDaysMin:
      body.estimatedDaysMin !== undefined
        ? Math.max(0, Number(body.estimatedDaysMin) || 0)
        : cur.estimatedDaysMin,
    estimatedDaysMax:
      body.estimatedDaysMax !== undefined
        ? Math.max(0, Number(body.estimatedDaysMax) || 0)
        : cur.estimatedDaysMax,
    active: body.active !== undefined ? Boolean(body.active) : cur.active,
    order: body.order !== undefined ? Number(body.order) || 0 : cur.order,
  };
  await database.write(db);
  return NextResponse.json({ ok: true, shippingMethod: db.shippingMethods[idx] });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const db = await database.read();
  db.shippingMethods = (db.shippingMethods || []).filter((m) => m.id !== id);
  // پاک کردن از محصولات
  for (const p of db.products) {
    if (p.shippingMethodIds?.length) {
      p.shippingMethodIds = p.shippingMethodIds.filter((x) => x !== id);
    }
  }
  await database.write(db);
  return NextResponse.json({ ok: true });
}
