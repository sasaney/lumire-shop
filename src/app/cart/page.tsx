"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";

function toman(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

export default function CartPage() {
  const { items, removeItem, updateQty, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🛍️</div>
        <h1 className="text-xl font-extrabold mb-2">سبد خرید شما خالی است</h1>
        <p className="text-neutral-500 mb-6">محصولی برای نمایش وجود ندارد.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
        >
          مشاهده محصولات
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-6">سبد خرید</h1>

      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex items-center gap-4 bg-white border border-rose-100 rounded-2xl p-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.title}
              className="w-20 h-20 rounded-xl object-cover bg-rose-50 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm line-clamp-2">{item.title}</div>
              <div className="text-rose-700 font-bold mt-1">{toman(item.price)}</div>
            </div>
            <div className="flex items-center border border-rose-100 rounded-xl shrink-0">
              <button
                onClick={() => updateQty(item.productId, item.quantity + 1)}
                className="w-9 h-9 hover:text-rose-600"
              >
                +
              </button>
              <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
              <button
                onClick={() => updateQty(item.productId, item.quantity - 1)}
                className="w-9 h-9 hover:text-rose-600"
              >
                −
              </button>
            </div>
            <button
              onClick={() => removeItem(item.productId)}
              className="text-neutral-400 hover:text-rose-600 shrink-0 text-sm px-2"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white border border-rose-100 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">مبلغ قابل پرداخت</div>
          <div className="text-2xl font-extrabold text-rose-700">{toman(totalPrice)}</div>
        </div>
        <Link
          href="/checkout"
          className="px-8 py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
        >
          ادامه فرآیند خرید
        </Link>
      </div>
    </div>
  );
}
