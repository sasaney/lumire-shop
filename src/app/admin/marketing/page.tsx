"use client";

import { useEffect, useState } from "react";

export default function AdminMarketingPage() {
  const [data, setData] = useState<{ total: number; pages: { path: string; views: number }[] } | null>(null);

  useEffect(() => {
    fetch("/api/admin/analytics").then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <div className="py-10 text-center text-neutral-400">در حال بارگذاری...</div>;

  const max = Math.max(1, ...data.pages.map((p) => p.views));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-extrabold">مارکتینگ — آمار بازدید صفحات</h1>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="text-sm text-neutral-400">مجموع بازدید ثبت‌شده</div>
        <div className="text-3xl font-extrabold mt-1">{data.total.toLocaleString("fa-IR")}</div>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="font-bold mb-4">بازدید بر اساس صفحه</div>
        {data.pages.length === 0 ? (
          <div className="text-sm text-neutral-400">
            هنوز بازدیدی ثبت نشده. با باز شدن صفحات سایت توسط بازدیدکنندگان، آمار اینجا نمایش داده می‌شود.
          </div>
        ) : (
          <div className="space-y-3">
            {data.pages.map((p) => (
              <div key={p.path}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span dir="ltr" className="text-neutral-600">{p.path}</span>
                  <span className="font-bold">{p.views}</span>
                </div>
                <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(p.views / max) * 100}%` }}
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
