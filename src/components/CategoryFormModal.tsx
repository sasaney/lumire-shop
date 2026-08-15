"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";

export interface CategoryFormValues {
  name: string;
  nameEn: string;
  icon: string;
  wcCategoryId: string;
  link: string;
  order: string;
  isActive: boolean;
}

export default function CategoryFormModal({
  title,
  initial,
  categories,
  parentId,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  initial?: Partial<CategoryFormValues>;
  categories: Category[];
  parentId: string | null;
  onClose: () => void;
  onSave: (values: CategoryFormValues) => void;
  saving?: boolean;
}) {
  const [form, setForm] = useState<CategoryFormValues>({
    name: "",
    nameEn: "",
    icon: "",
    wcCategoryId: "",
    link: "",
    order: "0",
    isActive: true,
    ...initial,
  });

  const isRoot = !parentId;
  const input = "w-full px-3 py-2.5 rounded-xl border border-rose-100 bg-white text-sm outline-none focus:ring-2 focus:ring-rose-100";

  useEffect(() => {
    if (!form.link && form.wcCategoryId) {
      setForm((f) => ({ ...f, link: `/products?category=${f.wcCategoryId}` }));
    }
  }, [form.wcCategoryId]);

  function set<K extends keyof CategoryFormValues>(key: K, value: CategoryFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/45 flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl" dir="rtl">
        <div className="flex items-center justify-between p-4 border-b border-rose-100">
          <div>
            <h2 className="font-extrabold text-base">{title}</h2>
            <p className="text-[11px] text-neutral-400 mt-1">اطلاعات نمایشی، لینک و اتصال به دسته محصول را تنظیم کنید.</p>
          </div>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-rose-600 text-2xl leading-none">×</button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <Field label="نام دسته‌بندی" required value={form.name} onChange={(v) => set("name", v)} placeholder="نام فارسی" />
          <Field label="نام انگلیسی" value={form.nameEn} onChange={(v) => set("nameEn", v)} placeholder="English name" dir="ltr" />

          {isRoot && (
            <div>
              <label className="block text-xs font-bold mb-1.5">آیکون SVG <span className="text-neutral-400 font-normal">(اختیاری؛ فقط دسته اصلی)</span></label>
              <div className="flex gap-3 items-start">
                <textarea value={form.icon} onChange={(e) => set("icon", e.target.value)} rows={4} dir="ltr" className={`${input} flex-1 resize-y`} placeholder='<svg viewBox="0 0 24 24" ...>...</svg>' />
                <div className="w-14 h-14 rounded-xl border border-rose-100 flex items-center justify-center shrink-0 overflow-hidden" dangerouslySetInnerHTML={{ __html: form.icon || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9"/><path d="M12 8v4l2 2"/></svg>' }} />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold mb-1.5">دستهٔ محصول (ووکامرس)</label>
            <select value={form.wcCategoryId} onChange={(e) => set("wcCategoryId", e.target.value)} className={input}>
              <option value="">— انتخاب دستهٔ محصول —</option>
              {categories.filter((c) => c.id !== parentId).map((c) => (
                <option key={c.id} value={c.id}>{c.parentId ? `└ ${c.name}` : c.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-neutral-400 mt-1.5">شناسه این فیلد برای اتصال آیتم منو/دسته نمایشی به دسته محصولات استفاده می‌شود.</p>
          </div>

          <Field label="لینک (اختیاری)" value={form.link} onChange={(v) => set("link", v)} placeholder="/products?category=719&brand=samsung" dir="ltr" />
          <p className="text-[11px] text-neutral-400 -mt-2">می‌توانید فیلترها را در لینک قرار دهید؛ مانند <code>?category=719&max_price=15000000</code></p>

          <div className="grid grid-cols-[1fr_auto] gap-4 items-end">
            <Field label="ترتیب نمایش" value={form.order} onChange={(v) => set("order", v)} type="number" />
            <label className="flex items-center gap-2 pb-2 text-sm font-bold">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4" />
              فعال
            </label>
          </div>
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-rose-100">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-rose-100 text-sm font-bold">انصراف</button>
          <button type="button" disabled={saving || !form.name.trim()} onClick={() => onSave(form)} className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-50">{saving ? "در حال ذخیره..." : "ذخیره"}</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, dir, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; dir?: "ltr" | "rtl"; type?: string; required?: boolean }) {
  return <div><label className="block text-xs font-bold mb-1.5">{label} {required && <span className="text-rose-500">*</span>}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} dir={dir} className="w-full px-3 py-2.5 rounded-xl border border-rose-100 bg-white text-sm outline-none focus:ring-2 focus:ring-rose-100" /></div>;
}
