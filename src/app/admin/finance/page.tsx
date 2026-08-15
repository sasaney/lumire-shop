"use client";

import { useEffect, useState } from "react";
import { toman } from "@/lib/order-status";

interface FinanceData {
  totalRevenue: number;
  codRevenue: number;
  cardRevenue: number;
  cancelledValue: number;
  returnedValue: number;
  orderCount: number;
  avgOrderValue: number;
  monthly: { month: string; revenue: number }[];
}

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);

  useEffect(() => {
    fetch("/api/admin/finance").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="py-10 text-center text-neutral-400">در حال بارگذاری...</div>;

  const maxMonthly = Math.max(1, ...data.monthly.map((m) => m.revenue));

  const cards = [
    { label: "مجموع فروش (بدون لغوی/مرجوعی)", value: toman(data.totalRevenue) },
    { label: "میانگین ارزش سفارش", value: toman(data.avgOrderValue) },
    { label: "درآمد از پرداخت در محل", value: toman(data.codRevenue) },
    { label: "درآمد از کارت به کارت", value: toman(data.cardRevenue) },
    { label: "ارزش سفارش‌های لغوشده", value: toman(data.cancelledValue) },
    { label: "ارزش مرجوعی‌ها", value: toman(data.returnedValue) },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">بخش مالی</h1>
      <p className="text-sm text-neutral-500">
        گزارش مالی فروشگاه تک‌فروشنده — بدون تسویه بین چند فروشنده، صرفاً خلاصه‌ی درآمد و روند فروش.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white border border-rose-100 rounded-2xl p-5">
            <div className="text-sm text-neutral-400">{c.label}</div>
            <div className="text-xl font-extrabold mt-2">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="font-bold mb-4">روند فروش ماهانه</div>
        {data.monthly.length === 0 ? (
          <div className="text-sm text-neutral-400">هنوز سفارشی برای گزارش‌گیری ثبت نشده.</div>
        ) : (
          <div className="space-y-3">
            {data.monthly.map((m) => (
              <div key={m.month}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span dir="ltr">{m.month}</span>
                  <span className="font-bold">{toman(m.revenue)}</span>
                </div>
                <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(m.revenue / maxMonthly) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
