import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const db = await database.read();
  const counted = db.orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");

  const totalRevenue = counted.reduce((s, o) => s + o.total, 0);
  const codRevenue = counted
    .filter((o) => o.paymentMethod === "COD")
    .reduce((s, o) => s + o.total, 0);
  const cardRevenue = counted
    .filter((o) => o.paymentMethod === "CARD_TO_CARD")
    .reduce((s, o) => s + o.total, 0);
  const cancelledValue = db.orders
    .filter((o) => o.status === "CANCELLED")
    .reduce((s, o) => s + o.total, 0);
  const returnedValue = db.orders
    .filter((o) => o.status === "RETURNED")
    .reduce((s, o) => s + o.total, 0);

  const byMonth: Record<string, number> = {};
  for (const o of counted) {
    const month = o.createdAt.slice(0, 7); // YYYY-MM
    byMonth[month] = (byMonth[month] || 0) + o.total;
  }
  const monthly = Object.entries(byMonth)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return NextResponse.json({
    totalRevenue,
    codRevenue,
    cardRevenue,
    cancelledValue,
    returnedValue,
    orderCount: counted.length,
    avgOrderValue: counted.length ? Math.round(totalRevenue / counted.length) : 0,
    monthly,
  });
}
