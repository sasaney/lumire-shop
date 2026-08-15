"use client";

import { useEffect, useState } from "react";
import type { ScraperLogEntry } from "@/lib/types";

export default function AdminScraperLogPage() {
  const [logs, setLogs] = useState<ScraperLogEntry[]>([]);

  useEffect(() => {
    fetch("/api/admin/scraper-log").then((r) => r.json()).then((d) => setLogs(d.logs || []));
  }, []);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-extrabold">لاگ کرالر / اسکرپر</h1>
      <p className="text-sm text-neutral-500">
        هر بار که اسکرپر قیمت یا موجودی محصولی را از منبع بیرونی به‌روزرسانی کند، جزئیات تغییرات اینجا ثبت می‌شود.
      </p>

      {logs.length === 0 ? (
        <div className="bg-white border border-rose-100 rounded-2xl p-10 text-center text-neutral-400">
          هنوز اسکرپری اجرا نشده. بعد از فعال‌سازی اسکرپر برای سایت‌های مقصد (از تب «دریافت اطلاعات» در فرم محصول)، تغییرات هر اجرا اینجا نمایش داده می‌شود.
        </div>
      ) : (
        <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-rose-50 text-neutral-500">
              <tr>
                <th className="text-right p-3">محصول</th>
                <th className="text-right p-3">زمان</th>
                <th className="text-right p-3">تغییر داشته؟</th>
                <th className="text-right p-3">جزئیات تغییرات</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-rose-50">
                  <td className="p-3">{log.productTitle}</td>
                  <td className="p-3 text-neutral-400">
                    {new Date(log.timestamp).toLocaleString("fa-IR")}
                  </td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${log.changed ? "bg-rose-50 text-rose-600" : "bg-neutral-100 text-neutral-400"}`}>
                      {log.changed ? "بله" : "بدون تغییر"}
                    </span>
                  </td>
                  <td className="p-3 text-xs text-neutral-500">
                    {log.changes.map((c) => `${c.field}: ${c.oldValue} → ${c.newValue}`).join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
