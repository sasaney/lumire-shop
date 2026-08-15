import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "ابتدا وارد شوید." }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const db = await database.read();
  const idx = db.orders.findIndex((o) => o.id === id);
  if (idx === -1) return NextResponse.json({ error: "سفارش یافت نشد." }, { status: 404 });

  const order = db.orders[idx];

  if (session.role === "ADMIN") {
    // ادمین می‌تواند وضعیت، کد رهگیری و شرکت حمل را تغییر دهد
    if (body.status) order.status = body.status;
    if (body.trackingCode !== undefined) order.trackingCode = body.trackingCode;
    if (body.shippingProvider !== undefined) order.shippingProvider = body.shippingProvider;
  } else {
    // خریدار فقط می‌تواند رسید واریزی سفارش خودش را آپلود کند (وضعیت: در انتظار پرداخت)
    if (order.userId !== session.userId) {
      return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
    }
    if (body.receiptImage && order.status === "AWAITING_PAYMENT") {
      order.receiptImage = body.receiptImage;
      order.status = "NEW";
    } else {
      return NextResponse.json({ error: "امکان این تغییر وجود ندارد." }, { status: 403 });
    }
  }

  await database.write(db);
  return NextResponse.json({ ok: true, order });
}
