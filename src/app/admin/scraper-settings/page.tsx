"use client";

import { useEffect, useState } from "react";
import type { ScraperSettings, ScraperSource } from "@/lib/types";

export default function AdminScraperSettingsPage() {
  const [settings, setSettings] = useState<ScraperSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<string | null>(null);
  const [newSource, setNewSource] = useState({ name: "", baseUrl: "" });

  async function load() {
    const res = await fetch("/api/admin/scraper/settings");
    const data = await res.json();
    const s = data.settings as ScraperSettings;
    if (!Array.isArray(s.sources)) s.sources = [];
    setSettings(s);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(patch: Partial<ScraperSettings>) {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/scraper/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      setSettings(data.settings);
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    setRunResult(null);
    try {
      const res = await fetch("/api/admin/scraper/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setRunResult(data.error || "اجرای اسکرپر با خطا مواجه شد.");
        return;
      }
      setRunResult(
        `بررسی شد: ${data.summary.checked} | به‌روزرسانی شد: ${data.summary.updated} | خطا: ${data.summary.failed}`
      );
    } finally {
      setRunning(false);
    }
  }

  function addSource() {
    if (!settings || !newSource.name.trim()) return;
    const src: ScraperSource = {
      id: `src-${Date.now()}`,
      name: newSource.name.trim(),
      baseUrl: newSource.baseUrl.trim(),
      active: true,
    };
    save({ sources: [...(settings.sources || []), src] });
    setNewSource({ name: "", baseUrl: "" });
  }

  if (!settings) return <div className="py-10 text-center text-neutral-400">در حال بارگذاری...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-extrabold">تنظیمات اسکرپر</h1>
        <p className="text-sm text-neutral-500 mt-1">
          منابع اسکرپ و تنظیمات خودکار را اینجا مدیریت کنید. منابع در تب «دریافت اطلاعات» محصول نمایش داده می‌شوند.
        </p>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-4">
        <label className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">اسکرپر خودکار</div>
            <div className="text-xs text-neutral-400">
              اگر فعال باشد، طبق زمان‌بندی کران قیمت و موجودی به‌روزرسانی می‌شود.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => save({ enabled: e.target.checked })}
            className="w-5 h-5 accent-rose-600"
          />
        </label>

        <label className="flex items-center justify-between gap-4">
          <div>
            <div className="font-bold text-sm">چک لحظه‌ای موقع ثبت سفارش</div>
            <div className="text-xs text-neutral-400">
              قبل از نهایی‌شدن سفارش، محصولات دارای منبع خارجی یک‌بار دیگر چک می‌شوند.
            </div>
          </div>
          <input
            type="checkbox"
            checked={settings.liveCheckOnCheckout}
            onChange={(e) => save({ liveCheckOnCheckout: e.target.checked })}
            className="w-5 h-5 accent-rose-600"
          />
        </label>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-rose-50">
          <div>
            <label className="block text-xs font-bold mb-1.5">درصد مارک‌آپ پیش‌فرض روی قیمت اصلی</label>
            <input
              type="number"
              defaultValue={settings.defaultPriceMarkupPercent}
              onBlur={(e) => save({ defaultPriceMarkupPercent: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5">درصد مارک‌آپ پیش‌فرض روی قیمت تخفیف</label>
            <input
              type="number"
              defaultValue={settings.defaultDiscountMarkupPercent}
              onBlur={(e) => save({ defaultDiscountMarkupPercent: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100"
            />
          </div>
        </div>
        {saving && <div className="text-xs text-neutral-400">در حال ذخیره...</div>}
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5 space-y-4">
        <div className="font-bold">منابع اسکرپ (سایت‌ها)</div>
        <p className="text-xs text-neutral-500">
          این لیست در فرم محصول → دریافت اطلاعات نمایش داده می‌شود. می‌توانید منبع اضافه یا حذف کنید.
        </p>
        <div className="space-y-2">
          {(settings.sources || []).map((s) => (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center gap-2 border border-rose-100 rounded-xl p-3"
            >
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{s.name}</div>
                {s.baseUrl && (
                  <div className="text-xs text-neutral-400 truncate" dir="ltr">
                    {s.baseUrl}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    save({
                      sources: settings.sources.map((x) =>
                        x.id === s.id ? { ...x, active: !x.active } : x
                      ),
                    })
                  }
                  className={`text-xs px-2.5 py-1.5 rounded-full font-bold ${
                    s.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {s.active !== false ? "فعال" : "غیرفعال"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    save({ sources: settings.sources.filter((x) => x.id !== s.id) })
                  }
                  className="text-xs text-rose-600 px-2"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
          {(settings.sources || []).length === 0 && (
            <div className="text-sm text-neutral-400">منبعی تعریف نشده.</div>
          )}
        </div>
        <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 pt-2 border-t border-rose-50">
          <input
            value={newSource.name}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            placeholder="نام منبع (مثلاً دیجی‌کالا)"
            className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm"
          />
          <input
            value={newSource.baseUrl}
            onChange={(e) => setNewSource({ ...newSource, baseUrl: e.target.value })}
            placeholder="https://..."
            dir="ltr"
            className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm"
          />
          <button
            type="button"
            onClick={addSource}
            className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700"
          >
            + افزودن
          </button>
        </div>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-5">
        <div className="font-bold mb-2">اجرای دستی روی همه محصولات</div>
        <p className="text-sm text-neutral-500 mb-4">
          روی همه محصولات دارای لینک منبع اجرا می‌شود. برای یک محصول خاص از لیست محصولات دکمه ↻ را بزنید.
        </p>
        <button
          onClick={runNow}
          disabled={running}
          className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition disabled:opacity-60"
        >
          {running ? "در حال اجرا..." : "اجرای اسکرپر روی همه محصولات"}
        </button>
        {runResult && <div className="mt-3 text-sm bg-emerald-50 text-emerald-700 rounded-xl p-3">{runResult}</div>}
      </div>
    </div>
  );
}
