"use client";

import { useEffect, useState } from "react";
import type { Order, OrderStatus } from "@/lib/types";
import { statusLabels, statusColors, statusOrder, toman } from "@/lib/order-status";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | "">("");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { code: string; provider: string }>>({});

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id: string, status: OrderStatus) {
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function saveTracking(id: string) {
    const draft = trackingDrafts[id];
    if (!draft?.code) return;
    await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SHIPPED",
        trackingCode: draft.code,
        shippingProvider: draft.provider,
      }),
    });
    load();
  }

  const filtered = filter ? orders.filter((o) => o.status === filter) : orders;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">سفارش‌ها</h1>

      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilter("")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
            !filter ? "bg-rose-600 text-white border-rose-600" : "border-rose-100 text-neutral-500"
          }`}
        >
          همه ({orders.length})
        </button>
        {statusOrder.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border ${
              filter === s ? "bg-rose-600 text-white border-rose-600" : "border-rose-100 text-neutral-500"
            }`}
          >
            {statusLabels[s]} ({orders.filter((o) => o.status === s).length})
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-rose-100 rounded-2xl p-10 text-center text-neutral-400">
          سفارشی در این وضعیت وجود ندارد.
        </div>
      ) : (
        filtered.map((order) => (
          <div key={order.id} className="bg-white border border-rose-100 rounded-2xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-bold">{order.receiverName}</div>
                <div className="text-xs text-neutral-400" dir="ltr">{order.phone}</div>
              </div>
              <select
                value={order.status}
                onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                className={`text-xs font-bold px-3 py-1.5 rounded-full border-0 ${statusColors[order.status]}`}
              >
                {statusOrder.map((s) => (
                  <option key={s} value={s}>
                    {statusLabels[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-sm text-neutral-500 mt-3">{order.address}</div>
            {order.note && <div className="text-xs text-neutral-400 mt-1">یادداشت: {order.note}</div>}

            {order.receiptImage && (
              <div className="mt-3">
                <div className="text-xs font-bold mb-1.5">رسید واریزی کارت به کارت:</div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={order.receiptImage} alt="رسید" className="max-w-[220px] rounded-xl border border-rose-100" />
              </div>
            )}

            <div className="mt-3 divide-y divide-rose-50">
              {order.items.map((it) => (
                <div key={it.productId} className="py-2 flex items-center justify-between text-sm">
                  <span>
                    {it.title} <span className="text-neutral-400">× {it.quantity}</span>
                  </span>
                  <span className="font-medium">{toman(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            {order.status === "SHIPPING" && !order.trackingCode && (
              <div className="mt-3 bg-sage-50 rounded-xl p-3 flex flex-wrap gap-2 items-end">
                <div>
                  <label className="block text-xs font-bold mb-1">کد رهگیری</label>
                  <input
                    dir="ltr"
                    value={trackingDrafts[order.id]?.code || ""}
                    onChange={(e) =>
                      setTrackingDrafts((d) => ({
                        ...d,
                        [order.id]: { code: e.target.value, provider: d[order.id]?.provider || "" },
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-rose-100 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">شرکت حمل</label>
                  <input
                    value={trackingDrafts[order.id]?.provider || ""}
                    onChange={(e) =>
                      setTrackingDrafts((d) => ({
                        ...d,
                        [order.id]: { code: d[order.id]?.code || "", provider: e.target.value },
                      }))
                    }
                    className="px-3 py-2 rounded-lg border border-rose-100 text-sm"
                  />
                </div>
                <button
                  onClick={() => saveTracking(order.id)}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-bold"
                >
                  ثبت و تغییر به «ارسال شده»
                </button>
              </div>
            )}

            {order.trackingCode && (
              <div className="mt-3 bg-sage-50 rounded-xl p-3 text-sm">
                <span className="font-bold">کد رهگیری: </span>
                <span dir="ltr">{order.trackingCode}</span>
                {order.shippingProvider && <span className="text-neutral-400"> ({order.shippingProvider})</span>}
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-sm">
              <span className="text-neutral-400">
                {order.paymentMethod === "COD" ? "پرداخت در محل" : "کارت به کارت"} ·{" "}
                {new Date(order.createdAt).toLocaleDateString("fa-IR")}
              </span>
              <span className="font-extrabold text-rose-700">{toman(order.total)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
