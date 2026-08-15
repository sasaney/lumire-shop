"use client";

import { useEffect, useState } from "react";
import type { CmsPage } from "@/lib/types";

const emptyForm = {
  title: "",
  slug: "",
  content: "",
  customCode: "",
  image: "",
  status: "DRAFT" as "DRAFT" | "PUBLISHED",
};

export default function AdminContentPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/pages");
    setPages((await res.json()).pages || []);
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setForm(emptyForm);
    setEditing(null);
    setShowForm(true);
    setError("");
  }

  function openEdit(p: CmsPage) {
    setForm({
      title: p.title,
      slug: p.slug,
      content: p.content,
      customCode: p.customCode || "",
      image: p.image || "",
      status: p.status,
    });
    setEditing(p.id);
    setShowForm(true);
    setError("");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        title: form.title,
        slug: form.slug,
        content: form.content,
        customCode: form.customCode || null,
        image: form.image || null,
        status: form.status,
      };
      const res = await fetch(editing ? `/api/admin/pages/${editing}` : "/api/admin/pages", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error);
      setShowForm(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("این صفحه حذف شود؟")) return;
    await fetch(`/api/admin/pages/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">محتوا و بلاگ</h1>
        <button
          onClick={openNew}
          className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition"
        >
          + مقاله / صفحه جدید
        </button>
      </div>
      <p className="text-sm text-neutral-500">
        صفحات و مقالاتی که اینجا با وضعیت «منتشر شده» ذخیره کنید، در آدرس <code dir="ltr">/pages/[slug]</code> در دسترس خواهند بود. متن هدر و فوتر سایت را از «تنظیمات سایت» ویرایش کنید.
      </p>

      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-rose-100 rounded-2xl p-5 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <input
              required
              placeholder="عنوان صفحه"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="px-4 py-2.5 rounded-xl border border-rose-100"
            />
            <input
              required
              placeholder="آدرس صفحه (slug) — مثلاً: راهنمای-پوست-چرب"
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
              dir="ltr"
              className="px-4 py-2.5 rounded-xl border border-rose-100"
            />
            <input
              placeholder="آدرس تصویر صفحه (اختیاری)"
              value={form.image}
              onChange={(e) => setForm({ ...form, image: e.target.value })}
              dir="ltr"
              className="px-4 py-2.5 rounded-xl border border-rose-100 sm:col-span-2"
            />
          </div>
          <textarea
            placeholder="محتوای صفحه"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={6}
            className="w-full px-4 py-2.5 rounded-xl border border-rose-100 resize-none"
          />
          <div>
            <label className="block text-xs font-bold mb-1.5">
              کد سفارشی (HTML / CSS / JS) — اگر متن آماده دارید همینجا Paste کنید
            </label>
            <textarea
              value={form.customCode}
              onChange={(e) => setForm({ ...form, customCode: e.target.value })}
              rows={5}
              dir="ltr"
              placeholder="<div>...</div>"
              className="w-full px-4 py-2.5 rounded-xl border border-rose-100 resize-none font-mono text-xs"
            />
          </div>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as "DRAFT" | "PUBLISHED" })}
            className="px-4 py-2.5 rounded-xl border border-rose-100"
          >
            <option value="DRAFT">پیش‌نویس</option>
            <option value="PUBLISHED">منتشر شده</option>
          </select>
          {error && <div className="text-sm text-rose-600 bg-rose-50 rounded-xl p-3">{error}</div>}
          <div className="flex gap-3">
            <button
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition disabled:opacity-60"
            >
              {saving ? "در حال ذخیره..." : "ذخیره صفحه"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-6 py-2.5 rounded-xl border border-rose-100 text-sm font-bold"
            >
              انصراف
            </button>
          </div>
        </form>
      )}

      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-rose-50 text-neutral-500">
            <tr>
              <th className="text-right p-3">عنوان</th>
              <th className="text-right p-3">آدرس</th>
              <th className="text-right p-3">وضعیت</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-t border-rose-50">
                <td className="p-3">{p.title}</td>
                <td className="p-3 text-neutral-400" dir="ltr">/pages/{p.slug}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${p.status === "PUBLISHED" ? "bg-sage-50 text-sage-600" : "bg-neutral-100 text-neutral-500"}`}>
                    {p.status === "PUBLISHED" ? "منتشر شده" : "پیش‌نویس"}
                  </span>
                </td>
                <td className="p-3 flex gap-2 justify-end">
                  <button onClick={() => openEdit(p)} className="text-sage-600 hover:underline">ویرایش</button>
                  <button onClick={() => handleDelete(p.id)} className="text-rose-600 hover:underline">حذف</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pages.length === 0 && (
          <div className="p-6 text-center text-sm text-neutral-400">هنوز صفحه‌ای ثبت نشده.</div>
        )}
      </div>
    </div>
  );
}
