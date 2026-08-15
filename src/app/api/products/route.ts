import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { validate, productCreateSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  const db = await database.read();
  const session = await getSession();
  const isAdmin = session?.role === "ADMIN";

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.toLowerCase();
  const discounted = searchParams.get("discounted");
  const limit = searchParams.get("limit");

  let products = db.products;
  if (!isAdmin) products = products.filter((p) => p.status === "PUBLISHED");
  if (category) products = products.filter((p) => p.categoryIds.includes(category));
  if (q) products = products.filter((p) => p.title.toLowerCase().includes(q));
  if (discounted) {
    products = products.filter(
      (p) => p.compareAtPrice !== null && p.compareAtPrice > p.price
    );
  }
  if (limit) products = products.slice(0, Number(limit));

  const res = NextResponse.json({ products, categories: db.categories, brands: db.brands });
  if (!isAdmin) {
    res.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=60");
  } else {
    res.headers.set("Cache-Control", "private, no-store");
  }
  return res;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const rawBody = await req.json().catch(() => null);
  const result = validate(productCreateSchema, rawBody);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const body = result.data;

  const db = await database.read();
  const product = {
    id: genId("p"),
    code: body.code || null,
    title: body.title,
    titleEn: body.titleEn || null,
    sku: body.sku || null,
    categoryIds: body.categoryIds,
    brandId: body.brandId || null,
    price: Number(body.price),
    compareAtPrice: body.compareAtPrice ? Number(body.compareAtPrice) : null,
    stock: Number(body.stock) || 0,
    displayStockOverride:
      body.displayStockOverride !== undefined && body.displayStockOverride !== ""
        ? Number(body.displayStockOverride)
        : null,
    status: body.status || "PUBLISHED",
    badge: body.badge || null,
    image:
      (Array.isArray(body.images) && body.images[0]) ||
      body.image ||
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600",
    images: Array.isArray(body.images) ? body.images : body.image ? [body.image] : [],
    video: body.video || null,
    color: body.color || (Array.isArray(body.colors) ? body.colors[0] || null : null),
    colors: Array.isArray(body.colors) ? body.colors : body.color ? [body.color] : [],
    weightGrams: body.weightGrams ?? null,
    lengthCm: body.lengthCm ?? null,
    widthCm: body.widthCm ?? null,
    heightCm: body.heightCm ?? null,
    warranties: Array.isArray(body.warranties) ? body.warranties : [],
    attributes: Array.isArray(body.attributes) ? body.attributes : [],
    commissionPercent: body.commissionPercent ?? null,
    sourceType: body.sourceType || null,
    description: body.description || "",
    descriptionHtml: body.descriptionHtml || null,
    sourceUrl: body.sourceUrl || null,
    crawlerEnabled: body.crawlerEnabled ?? Boolean(body.sourceUrl),
    priceMarkupPercent: body.priceMarkupPercent ?? null,
    shippingMethodIds: body.shippingMethodIds ?? null,
    discountMarkupPercent: body.discountMarkupPercent ?? null,
    lastScrapedAt: null,
    rating: 0,
    createdAt: new Date().toISOString(),
  };
  db.products.unshift(product);
  await database.write(db);

  return NextResponse.json({ ok: true, product });
}
