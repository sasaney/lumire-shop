import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { FreightType, ShippingMethod } from "@/lib/types";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const db = await database.read();
  const methods = [...(db.shippingMethods || [])].sort((a, b) => a.order - b.order);
  return NextResponse.json({ shippingMethods: methods });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: "نام روش ارسال الزامی است." }, { status: 400 });
  }

  const freightType: FreightType =
    body.freightType === "COLLECT" ? "COLLECT" : "PREPAID";

  const method: ShippingMethod = {
    id: genId("ship"),
    name: String(body.name).trim(),
    description: body.description ? String(body.description).trim() : "",
    cost: Math.max(0, Number(body.cost) || 0),
    freightType,
    estimatedDaysMin: Math.max(0, Number(body.estimatedDaysMin) || 1),
    estimatedDaysMax: Math.max(0, Number(body.estimatedDaysMax) || 3),
    active: body.active !== false,
    order: Number(body.order) || 0,
  };

  const db = await database.read();
  if (!db.shippingMethods) db.shippingMethods = [];
  db.shippingMethods.push(method);
  await database.write(db);
  return NextResponse.json({ ok: true, shippingMethod: method });
}
