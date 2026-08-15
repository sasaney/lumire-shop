"use client";

import { useEffect, useState } from "react";
import type { FreightType, ShippingMethod } from "@/lib/types";

const empty = {
  name: "",
  description: "",
  cost: "0",
  freightType: "PREPAID" as FreightType,
  estimatedDaysMin: "2",
  estimatedDaysMax: "4",
  active: true,
  order: "0",
};

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/shipping");
    const data = await res.json();
    setMethods(data.shippingMethods || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(m: ShippingMethod) {
    setEditing(m.id);
    setForm({
      name: m.name,
      description: m.description || "",
      cost: String(m.cost),
      freightType: m.freightType,
      estimatedDaysMin: String(m.estimatedDaysMin),
      estimatedDaysMax: String(m.estimatedDaysMax),
      active: m.active,
      order: String(m.order),
    });
  }

  function openNew() {
    setEditing(null);
    setForm(empty);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        cost: Number(form.cost) || 0,
        freightType: form.freightType,
        estimatedDaysMin: Number(form.estimatedDaysMin) || 0,
        estimatedDaysMax: Number(form.estimatedDaysMax) || 0,
        active: form.active,
        order: Number(form.order) || 0,
      };
      const url = editing ? `/api/admin/shipping/${editing}` : "/api/admin/shipping";
      await fetch(url, {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setEditing(null);
      setForm(empty);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این روش ارسال حذف شود؟ از محصولات هم برداشته می‌شود.")) return;
    await fetch(`/api/admin/shipping/${id}`, { method: "DELETE" });
    load();
  }

  async function toggleActive(m: ShippingMethod) {
    await fetch(`/api/admin/shipping/${m.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !m.active }),
    });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold">روش‌های ارسال</h1>
          <p className="text-sm text-neutral-500 mt-1">
            هزینه، نوع کرایه (پیش/پس)، زمان تقریبی و وضعیت فعال را مدیریت کنید. در فرم محصول می‌توانید روش‌های مجاز هر کالا را محدود کنید.
          </p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700"
        >
          + روش جدید
        </button>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
        <div className="divide-y divide-rose-50">
          {methods.map((m) => (
            <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{m.name}</div>
                <div className="text-xs text-neutral-400 mt-0.5">
                  {m.freightType === "PREPAID" ? "پیش‌کرایه" : "پس‌کرایه"}
                  {" · "}
                  {m.cost > 0 ? `${m.cost.toLocaleString("fa-IR")} تومان` : "بدون هزینه ثابت"}
                  {" · "}
                  {m.estimatedDaysMin}–{m.estimatedDaysMax} روز
                </div>
                {m.description && (
                  <div className="text-xs text-neutral-500 mt-1 line-clamp-2">{m.description}</div>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => toggleActive(m)}
                  className={`text-xs px-2.5 py-1.5 rounded-full font-bold ${
                    m.active ? "bg-sage-50 text-sage-600" : "bg-neutral-100 text-neutral-400"
                  }`}
                >
                  {m.active ? "فعال" : "غیرفعال"}
                </button>
                <button type="button" onClick={() => openEdit(m)} className="text-xs px-3 py-1.5 rounded-lg border border-rose-100 hover:bg-rose-50">
                  ویرایش
                </button>
                <button type="button" onClick={() => handleDelete(m.id)} className="text-xs text-rose-600 px-2">
                  حذف
                </button>
              </div>
            </div>
          ))}
          {methods.length === 0 && (
            <div className="p-8 text-center text-neutral-400 text-sm">روش ارسالی تعریف نشده.</div>
          )}
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
        <div className="font-bold">{editing ? "ویرایش روش ارسال" : "روش ارسال جدید"}</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="نام روش (مثلاً پست پیشتاز)"
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          />
          <select
            value={form.freightType}
            onChange={(e) => setForm({ ...form, freightType: e.target.value as FreightType })}
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          >
            <option value="PREPAID">پیش‌کرایه (هزینه موقع سفارش)</option>
            <option value="COLLECT">پس‌کرایه (هزینه در محل)</option>
          </select>
          <input
            value={form.cost}
            onChange={(e) => setForm({ ...form, cost: e.target.value })}
            placeholder="هزینه (تومان)"
            inputMode="numeric"
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          />
          <input
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
            placeholder="ترتیب نمایش"
            inputMode="numeric"
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          />
          <input
            value={form.estimatedDaysMin}
            onChange={(e) => setForm({ ...form, estimatedDaysMin: e.target.value })}
            placeholder="حداقل روز"
            inputMode="numeric"
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          />
          <input
            value={form.estimatedDaysMax}
            onChange={(e) => setForm({ ...form, estimatedDaysMax: e.target.value })}
            placeholder="حداکثر روز"
            inputMode="numeric"
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          placeholder="توضیح برای مشتری"
          className="w-full px-4 py-2.5 rounded-xl border border-rose-100 resize-none"
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
          />
          فعال
        </label>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? "..." : "ذخیره"}
          </button>
          {editing && (
            <button type="button" onClick={openNew} className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm">
              انصراف
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
