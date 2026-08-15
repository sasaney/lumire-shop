import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { OrderItem } from "@/lib/types";
import { validate, orderCreateSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { scrapeSingleProduct } from "@/lib/scraper-run";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });

  const db = await database.read();
  const orders =
    session.role === "ADMIN"
      ? db.orders
      : db.orders.filter((o) => o.userId === session.userId);

  return NextResponse.json({ orders: orders.reverse() });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });

  const ip = getClientIp(req);
  const rl = rateLimit(`order-create:${ip}`, 20, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تعداد سفارش‌های ثبت‌شده در بازه زمانی اخیر زیاد است." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = validate(orderCreateSchema, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { items, address, phone, receiverName, paymentMethod, note, shippingMethodId } = result.data;

  const db = await database.read();

  // چک لحظه‌ای: قبل از قفل‌شدن سفارش، برای محصولاتی که منبع خارجی دارند یک‌بار دیگر
  // قیمت/موجودی را (با timeout کوتاه تا سرعت چک‌اوت افت نکند) به‌روز می‌کنیم.
  if (db.scraperSettings.liveCheckOnCheckout) {
    const productIdsInCart = new Set(items.map((it) => it.productId));
    const targets = db.products.filter((p) => productIdsInCart.has(p.id) && p.sourceUrl);
    await Promise.all(
      targets.map((p) => scrapeSingleProduct(db, p, 3000).catch(() => "failed" as const))
    );
  }

  const orderItems: OrderItem[] = [];
  let total = 0;

  for (const it of items) {
    const product = db.products.find((p) => p.id === it.productId);
    if (!product) continue;
    if (product.stock < it.quantity) {
      return NextResponse.json(
        { error: `موجودی «${product.title}» کافی نیست.` },
        { status: 400 }
      );
    }
    orderItems.push({
      productId: product.id,
      title: product.title,
      price: product.price,
      quantity: it.quantity,
    });
    total += product.price * it.quantity;
    product.stock -= it.quantity;
  }

  if (!orderItems.length) {
    return NextResponse.json({ error: "سبد خرید معتبر نیست." }, { status: 400 });
  }

  // محاسبه روش ارسال
  const ship = (db.shippingMethods || []).find((m) => m.id === shippingMethodId && m.active);
  if (!ship) {
    return NextResponse.json({ error: "روش ارسال معتبر نیست." }, { status: 400 });
  }
  // بررسی مجاز بودن روش برای همه محصولات سبد
  for (const oi of orderItems) {
    const product = db.products.find((p) => p.id === oi.productId);
    if (product?.shippingMethodIds && product.shippingMethodIds.length > 0) {
      if (!product.shippingMethodIds.includes(ship.id)) {
        return NextResponse.json(
          { error: `روش ارسال «${ship.name}» برای «${product.title}» مجاز نیست.` },
          { status: 400 }
        );
      }
    }
  }
  const shippingCost = ship.freightType === "PREPAID" ? ship.cost : 0;
  const grandTotal = total + shippingCost;

  const method = paymentMethod || "COD";
  const order = {
    id: genId("order"),
    userId: session.userId,
    items: orderItems,
    total: grandTotal,
    shippingCost,
    shippingMethodId: ship.id,
    shippingMethodName: ship.name,
    status: method === "CARD_TO_CARD" ? ("AWAITING_PAYMENT" as const) : ("NEW" as const),
    paymentMethod: method,
    address,
    phone,
    receiverName,
    note,
    receiptImage: null,
    trackingCode: null,
    shippingProvider: ship.name,
    createdAt: new Date().toISOString(),
  };
  db.orders.push(order);
  await database.write(db);

  return NextResponse.json({ ok: true, order });
}
