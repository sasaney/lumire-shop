"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toman, statusLabels, statusColors } from "@/lib/order-status";
import type { Order, Product, User, Category, Brand } from "@/lib/types";

export default function AdminOverviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch("/api/products").then((r) => r.json()).then((d) => {
      setProducts(d.products || []);
      setCategories(d.categories || []);
      setBrands(d.brands || []);
    });
    fetch("/api/orders").then((r) => r.json()).then((d) => setOrders(d.orders || []));
    fetch("/api/admin/users").then((r) => r.json()).then((d) => setUsers(d.users || []));
  }, []);

  const deliveredOrCounted = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");
  const revenue = deliveredOrCounted.reduce((s, o) => s + o.total, 0);
  const buyers = users.filter((u) => u.role === "CUSTOMER");
  const avgOrderValue = deliveredOrCounted.length ? Math.round(revenue / deliveredOrCounted.length) : 0;

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const outOfStock = products.filter((p) => p.stock === 0);

  const salesByProduct: Record<string, { title: string; qty: number; revenue: number }> = {};
  for (const o of deliveredOrCounted) {
    for (const it of o.items) {
      if (!salesByProduct[it.productId]) salesByProduct[it.productId] = { title: it.title, qty: 0, revenue: 0 };
      salesByProduct[it.productId].qty += it.quantity;
      salesByProduct[it.productId].revenue += it.price * it.quantity;
    }
  }
  const topProducts = Object.values(salesByProduct).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const cards = [
    { label: "مجموع فروش", value: toman(revenue), accent: "text-rose-700" },
    { label: "میانگین ارزش سفارش", value: toman(avgOrderValue), accent: "text-rose-700" },
    { label: "کل سفارش‌ها", value: orders.length },
    { label: "خریداران ثبت‌نامی", value: buyers.length },
    { label: "تعداد محصولات", value: products.length },
    { label: "دسته‌بندی‌ها / برندها", value: `${categories.length} / ${brands.length}` },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">نمای کلی</h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-rose-100 rounded-2xl p-5">
            <div className="text-sm text-neutral-400">{c.label}</div>
            <div className={`text-2xl font-extrabold mt-2 ${c.accent || ""}`}>{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="font-bold mb-3">وضعیت سفارش‌ها</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(statusLabels).map(([key, label]) => (
            <Link
              key={key}
              href="/admin/orders"
              className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[key as keyof typeof statusColors]}`}
            >
              {label}: {statusCounts[key] || 0}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white border border-rose-100 rounded-2xl p-5">
          <div className="font-bold mb-3">پرفروش‌ترین محصولات</div>
          {topProducts.length === 0 ? (
            <div className="text-sm text-neutral-400">هنوز فروشی ثبت نشده.</div>
          ) : (
            <div className="space-y-2 text-sm">
              {topProducts.map((p) => (
                <div key={p.title} className="flex items-center justify-between">
                  <span className="line-clamp-1">{p.title}</span>
                  <span className="text-neutral-400 shrink-0">{p.qty} فروش · {toman(p.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-rose-100 rounded-2xl p-5">
          <div className="font-bold mb-3">هشدار موجودی</div>
          <div className="space-y-2 text-sm">
            {outOfStock.length === 0 && lowStock.length === 0 && (
              <div className="text-neutral-400">همه محصولات موجودی کافی دارند.</div>
            )}
            {outOfStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="line-clamp-1">{p.title}</span>
                <span className="text-neutral-400 font-bold">ناموجود</span>
              </div>
            ))}
            {lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="line-clamp-1">{p.title}</span>
                <span className="text-rose-600 font-bold">{p.stock} عدد باقی مانده</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="font-bold">آخرین سفارش‌ها</div>
          <Link href="/admin/orders" className="text-xs text-rose-600 font-bold hover:underline">
            مشاهده همه
          </Link>
        </div>
        <div className="space-y-2 text-sm">
          {orders.slice(0, 5).map((o) => (
            <div key={o.id} className="flex items-center justify-between">
              <span>{o.receiverName}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[o.status]}`}>
                {statusLabels[o.status]}
              </span>
              <span className="font-bold shrink-0">{toman(o.total)}</span>
            </div>
          ))}
          {orders.length === 0 && <div className="text-neutral-400">سفارشی ثبت نشده.</div>}
        </div>
      </div>
    </div>
  );
}
