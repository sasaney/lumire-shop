import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await database.read();
  const product = db.products.find((p) => p.id === id);
  if (!product) return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json();
  const db = await database.read();
  const idx = db.products.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: "محصول یافت نشد." }, { status: 404 });

  db.products[idx] = {
    ...db.products[idx],
    ...body,
    price: body.price !== undefined ? Number(body.price) : db.products[idx].price,
    stock: body.stock !== undefined ? Number(body.stock) : db.products[idx].stock,
    compareAtPrice:
      body.compareAtPrice !== undefined
        ? body.compareAtPrice
          ? Number(body.compareAtPrice)
          : null
        : db.products[idx].compareAtPrice,
    displayStockOverride:
      body.displayStockOverride !== undefined
        ? body.displayStockOverride !== "" && body.displayStockOverride !== null
          ? Number(body.displayStockOverride)
          : null
        : db.products[idx].displayStockOverride,
    image:
      Array.isArray(body.images) && body.images.length
        ? body.images[0]
        : body.image || db.products[idx].image,
  };
  await database.write(db);
  return NextResponse.json({ ok: true, product: db.products[idx] });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { id } = await params;
  const db = await database.read();
  db.products = db.products.filter((p) => p.id !== id);
  await database.write(db);
  return NextResponse.json({ ok: true });
}
