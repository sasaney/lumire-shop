import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";

/** لیست روش‌های ارسال فعال — برای چک‌اوت. اگر productIds داده شود، اشتراک روش‌های آن محصولات برگردانده می‌شود. */
export async function GET(req: NextRequest) {
  const db = await database.read();
  const { searchParams } = new URL(req.url);
  const productIds = searchParams.get("productIds")?.split(",").filter(Boolean) || [];

  let methods = (db.shippingMethods || []).filter((m) => m.active);

  if (productIds.length > 0) {
    const products = db.products.filter((p) => productIds.includes(p.id));
    // اشتراک روش‌ها: اگر محصولی shippingMethodIds داشته باشد محدود می‌شود؛ null/خالی = همه
    for (const p of products) {
      if (p.shippingMethodIds && p.shippingMethodIds.length > 0) {
        const allowed = new Set(p.shippingMethodIds);
        methods = methods.filter((m) => allowed.has(m.id));
      }
    }
  }

  methods = [...methods].sort((a, b) => a.order - b.order);
  return NextResponse.json({ shippingMethods: methods });
}
