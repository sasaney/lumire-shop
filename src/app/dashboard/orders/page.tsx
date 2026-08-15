"use client";

import { useEffect, useState } from "react";
import type { Order } from "@/lib/types";
import { statusLabels, statusColors, toman } from "@/lib/order-status";

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/orders");
    const data = await res.json();
    setOrders(data.orders || []);
  }

  useEffect(() => {
    load();
  }, []);

  function handleFileChange(orderId: string, file: File) {
    setUploadingId(orderId);
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch(`/api/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiptImage: reader.result }),
      });
      setUploadingId(null);
      load();
    };
    reader.readAsDataURL(file);
  }

  if (orders === null) {
    return <div className="text-center text-neutral-400 py-10">در حال بارگذاری...</div>;
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white border border-rose-100 rounded-2xl p-10 text-center text-neutral-400">
        هنوز سفارشی ثبت نکرده‌اید.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">سفارش‌های من</h1>
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-rose-100 rounded-2xl p-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-xs text-neutral-400">
              {new Date(order.createdAt).toLocaleDateString("fa-IR")}
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
          </div>
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

          {order.status === "AWAITING_PAYMENT" && (
            <div className="mt-3 bg-gold-400/10 rounded-xl p-3">
              <div className="text-sm font-bold mb-2">آپلود رسید واریزی کارت به کارت</div>
              <input
                type="file"
                accept="image/*"
                disabled={uploadingId === order.id}
                onChange={(e) => e.target.files?.[0] && handleFileChange(order.id, e.target.files[0])}
                className="text-xs"
              />
              {uploadingId === order.id && (
                <div className="text-xs text-neutral-400 mt-1">در حال آپلود...</div>
              )}
            </div>
          )}

          {order.trackingCode && (
            <div className="mt-3 bg-sage-50 rounded-xl p-3 text-sm">
              <span className="font-bold">کد رهگیری مرسوله: </span>
              <span dir="ltr">{order.trackingCode}</span>
              {order.shippingProvider && (
                <span className="text-neutral-400"> ({order.shippingProvider})</span>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-rose-100 flex items-center justify-between text-sm">
            <span className="text-neutral-400">
              {order.paymentMethod === "COD" ? "پرداخت در محل" : "کارت به کارت"}
            </span>
            <span className="font-extrabold text-rose-700">{toman(order.total)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
