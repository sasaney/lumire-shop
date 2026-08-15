"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { useSession } from "@/lib/use-session";
import type { ShippingMethod } from "@/lib/types";

function toman(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart();
  const session = useSession();
  const router = useRouter();

  const [receiverName, setReceiverName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CARD_TO_CARD">("COD");
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const productIds = useMemo(() => items.map((i) => i.productId).join(","), [items]);

  useEffect(() => {
    if (!productIds) return;
    fetch(`/api/shipping?productIds=${encodeURIComponent(productIds)}`)
      .then((r) => r.json())
      .then((d) => {
        const methods: ShippingMethod[] = d.shippingMethods || [];
        setShippingMethods(methods);
        if (methods.length && !shippingMethodId) {
          setShippingMethodId(methods[0].id);
        }
      })
      .catch(() => setShippingMethods([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productIds]);

  const selectedShip = shippingMethods.find((m) => m.id === shippingMethodId);
  const shippingCost =
    selectedShip && selectedShip.freightType === "PREPAID" ? selectedShip.cost : 0;
  const grandTotal = totalPrice + shippingCost;

  if (session === null) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-extrabold mb-3">ابتدا وارد حساب کاربری شوید</h1>
        <p className="text-neutral-500 mb-6">برای ثبت سفارش باید وارد حساب خود شوید.</p>
        <Link
          href="/login?next=/checkout"
          className="inline-block px-6 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
        >
          ورود / ثبت‌نام
        </Link>
      </div>
    );
  }

  if (items.length === 0 && !success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center text-neutral-500">
        سبد خرید شما خالی است.
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-xl font-extrabold mb-3">سفارش شما با موفقیت ثبت شد</h1>
        <p className="text-neutral-500 mb-6">
          می‌توانید وضعیت سفارش را از داشبورد حساب کاربری خود پیگیری کنید.
        </p>
        <Link
          href="/dashboard/orders"
          className="inline-block px-6 py-3 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition"
        >
          مشاهده سفارش‌ها
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!receiverName || !phone || !address) {
      setError("لطفاً همه فیلدهای ضروری را تکمیل کنید.");
      return;
    }
    if (!shippingMethodId) {
      setError("روش ارسال را انتخاب کنید.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          receiverName,
          phone,
          address,
          note,
          paymentMethod,
          shippingMethodId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ثبت سفارش با خطا مواجه شد.");
        return;
      }
      clear();
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-xl sm:text-2xl font-extrabold mb-6">تکمیل سفارش</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">نام گیرنده</label>
          <input
            value={receiverName}
            onChange={(e) => setReceiverName(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
            placeholder="نام و نام‌خانوادگی"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">شماره تماس</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
            placeholder="09xxxxxxxxx"
            dir="ltr"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">آدرس کامل</label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none resize-none"
            placeholder="استان، شهر، خیابان، پلاک، واحد"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">توضیحات (اختیاری)</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">روش ارسال</label>
          {shippingMethods.length === 0 ? (
            <div className="text-sm text-neutral-400 bg-neutral-50 rounded-xl p-3">
              روش ارسال فعالی برای این سبد تعریف نشده. با پشتیبانی تماس بگیرید.
            </div>
          ) : (
            <div className="space-y-2">
              {shippingMethods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setShippingMethodId(m.id)}
                  className={`w-full text-right p-4 rounded-xl border-2 transition ${
                    shippingMethodId === m.id
                      ? "border-rose-600 bg-rose-50"
                      : "border-rose-100 hover:border-rose-200"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-sm">{m.name}</div>
                      <div className="text-xs text-neutral-500 mt-1">
                        {m.estimatedDaysMin}–{m.estimatedDaysMax} روز کاری
                        {" · "}
                        {m.freightType === "PREPAID" ? "پیش‌کرایه" : "پس‌کرایه"}
                      </div>
                      {m.description && (
                        <div className="text-xs text-neutral-400 mt-1">{m.description}</div>
                      )}
                    </div>
                    <div className="text-sm font-bold text-rose-700 shrink-0">
                      {m.freightType === "COLLECT"
                        ? "پس‌کرایه"
                        : m.cost === 0
                          ? "رایگان"
                          : toman(m.cost)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">روش پرداخت</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMethod("COD")}
              className={`p-4 rounded-xl border-2 text-sm font-bold transition ${
                paymentMethod === "COD"
                  ? "border-rose-600 bg-rose-50 text-rose-700"
                  : "border-rose-100 text-neutral-500"
              }`}
            >
              پرداخت در محل
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod("CARD_TO_CARD")}
              className={`p-4 rounded-xl border-2 text-sm font-bold transition ${
                paymentMethod === "CARD_TO_CARD"
                  ? "border-rose-600 bg-rose-50 text-rose-700"
                  : "border-rose-100 text-neutral-500"
              }`}
            >
              کارت به کارت
            </button>
          </div>
          {paymentMethod === "CARD_TO_CARD" && (
            <div className="mt-3 text-sm bg-sage-50 text-sage-600 rounded-xl p-3">
              پس از ثبت سفارش، شماره کارت جهت واریز از طریق پشتیبانی برای شما ارسال می‌شود.
            </div>
          )}
        </div>

        {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</div>}

        <div className="border-t border-rose-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-neutral-500">
            <span>جمع محصولات</span>
            <span>{toman(totalPrice)}</span>
          </div>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>هزینه ارسال</span>
            <span>
              {selectedShip?.freightType === "COLLECT"
                ? "پس‌کرایه (در محل)"
                : shippingCost === 0
                  ? "رایگان"
                  : toman(shippingCost)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="text-sm text-neutral-500">مبلغ نهایی</div>
              <div className="text-xl font-extrabold text-rose-700">{toman(grandTotal)}</div>
            </div>
            <button
              type="submit"
              disabled={loading || !shippingMethodId}
              className="px-6 sm:px-8 py-3.5 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition disabled:opacity-60"
            >
              {loading ? "در حال ثبت..." : "ثبت نهایی سفارش"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
