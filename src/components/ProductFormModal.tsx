"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Brand, Category, Product, ProductAttributeGroup } from "@/lib/types";

export interface ProductFormValues {
  code: string;
  sku: string;
  title: string;
  titleEn: string;
  categoryIds: string[];
  brandId: string;
  status: Product["status"];
  badge: "" | "NEW" | "BESTSELLER";
  images: string[];
  video: string;
  weightGrams: string;
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  price: string;
  compareAtPrice: string;
  color: string;
  colors: string[];
  stock: string;
  displayStockOverride: string;
  description: string;
  descriptionHtml: string;
  warranties: string[];
  attributes: ProductAttributeGroup[];
  commissionPercent: string;
  sourceType: string;
  sourceUrl: string;
  crawlerEnabled: boolean;
  priceMarkupPercent: string;
  discountMarkupPercent: string;
  shippingMethodIds: string[];
}

export interface ScraperSourceOption {
  id: string;
  name: string;
  baseUrl?: string;
}

const TABS = [
  ["info", "اطلاعات"],
  ["images", "تصاویر"],
  ["price", "قیمت"],
  ["colors", "رنگ‌ها"],
  ["description", "معرفی محصول"],
  ["attributes", "مشخصات فنی"],
  ["datasource", "دریافت اطلاعات"],
  ["shipping", "ارسال"],
] as const;

type TabId = (typeof TABS)[number][0];

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-rose-100 focus:ring-2 focus:ring-rose-100 outline-none text-sm";

export function generateProductCodes() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return {
    code: `PRD-${stamp}-${rand}`,
    sku: `SKU-${stamp.slice(-4)}${rand}`,
  };
}

export default function ProductFormModal({
  categories,
  brands,
  shippingMethods = [],
  scraperSources = [],
  initial,
  onClose,
  onSave,
  saving,
}: {
  categories: Category[];
  brands: Brand[];
  shippingMethods?: { id: string; name: string; active: boolean }[];
  scraperSources?: ScraperSourceOption[];
  initial: ProductFormValues;
  onClose: () => void;
  onSave: (values: ProductFormValues) => void;
  saving: boolean;
}) {
  const [tab, setTab] = useState<TabId>("info");
  const [form, setForm] = useState<ProductFormValues>(initial);
  const [dragOver, setDragOver] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [scraperError, setScraperError] = useState("");
  const [scraperPreview, setScraperPreview] = useState<any>(null);
  const [brandOpen, setBrandOpen] = useState(false);
  const [brandSearch, setBrandSearch] = useState("");
  const [catPath, setCatPath] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (brandRef.current && !brandRef.current.contains(e.target as Node)) {
        setBrandOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const parents = useMemo(
    () => categories.filter((c) => !c.parentId).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [categories]
  );

  function childrenOf(parentId: string | null) {
    return categories
      .filter((c) => (c.parentId || null) === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function categoryById(id: string) {
    return categories.find((c) => c.id === id);
  }

  function addCategoryFromPath() {
    const last = catPath[catPath.length - 1];
    if (!last) return;
    if (form.categoryIds.includes(last)) return;
    set("categoryIds", [...form.categoryIds, last]);
    setCatPath([]);
  }

  function removeCategory(id: string) {
    set(
      "categoryIds",
      form.categoryIds.filter((x) => x !== id)
    );
  }

  const filteredBrands = useMemo(() => {
    const q = brandSearch.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter(
      (b) =>
        b.nameFa.toLowerCase().includes(q) ||
        (b.nameEn || "").toLowerCase().includes(q)
    );
  }, [brands, brandSearch]);

  const selectedBrand = brands.find((b) => b.id === form.brandId);

  function addFiles(files: FileList | File[]) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      const reader = new FileReader();
      reader.onload = () => setForm((f) => ({ ...f, images: [...f.images, reader.result as string] }));
      reader.readAsDataURL(file);
    });
  }

  function removeImage(idx: number) {
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  }

  function makeMain(idx: number) {
    setForm((f) => {
      const images = [...f.images];
      const [chosen] = images.splice(idx, 1);
      return { ...f, images: [chosen, ...images] };
    });
  }

  async function handleScraperFetch() {
    setScraperError("");
    setScraperPreview(null);
    if (!form.sourceUrl.trim()) {
      setScraperError("ابتدا آدرس URL محصول را وارد کنید.");
      return;
    }
    setScraping(true);
    try {
      const res = await fetch("/api/admin/scraper/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: form.sourceUrl.trim(),
          priceMarkupPercent: form.priceMarkupPercent ? Number(form.priceMarkupPercent) : undefined,
          discountMarkupPercent: form.discountMarkupPercent
            ? Number(form.discountMarkupPercent)
            : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScraperError(data.error || "دریافت اطلاعات ناموفق بود.");
        return;
      }
      setScraperPreview(data.suggested || data.raw);
    } catch {
      setScraperError("خطا در ارتباط با سرور.");
    } finally {
      setScraping(false);
    }
  }

  function importScraper() {
    if (!scraperPreview) return;
    setForm((f) => ({
      ...f,
      title: scraperPreview.title || f.title,
      description: scraperPreview.description || f.description,
      descriptionHtml: scraperPreview.descriptionHtml || f.descriptionHtml,
      images:
        scraperPreview.images?.length
          ? scraperPreview.images
          : scraperPreview.image
            ? [scraperPreview.image]
            : f.images,
      price: scraperPreview.price != null ? String(scraperPreview.price) : f.price,
      compareAtPrice:
        scraperPreview.compareAtPrice != null ? String(scraperPreview.compareAtPrice) : f.compareAtPrice,
      crawlerEnabled: true,
    }));
    setTab("info");
  }

  // cascade levels for category picker
  const cascadeLevels: { level: number; options: Category[]; value: string }[] = [];
  cascadeLevels.push({ level: 0, options: parents, value: catPath[0] || "" });
  for (let i = 0; i < catPath.length; i++) {
    const kids = childrenOf(catPath[i]);
    if (kids.length === 0) break;
    cascadeLevels.push({ level: i + 1, options: kids, value: catPath[i + 1] || "" });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl shadow-xl max-h-[95vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-rose-100">
          <h2 className="font-extrabold text-lg">جزئیات محصول</h2>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-rose-50 text-lg">
            ×
          </button>
        </div>

        <div className="tabs-scroll px-3 pt-2 border-b border-rose-100">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`tab-item px-3.5 py-2.5 text-xs sm:text-sm font-bold transition ${
                tab === id ? "tab-item-active text-rose-700" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {tab === "info" && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    کد کالا <span className="font-normal text-neutral-400">(خودکار)</span>
                  </label>
                  <input value={form.code} readOnly dir="ltr" className={`${inputClass} bg-neutral-50 text-neutral-400 cursor-default`} />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">
                    SKU <span className="font-normal text-neutral-400">(خودکار)</span>
                  </label>
                  <input value={form.sku} readOnly dir="ltr" className={`${inputClass} bg-neutral-50 text-neutral-400 cursor-default`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">عنوان محصول</label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  className={inputClass}
                  placeholder="عنوان فارسی"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">عنوان انگلیسی (اختیاری)</label>
                <input
                  value={form.titleEn}
                  onChange={(e) => set("titleEn", e.target.value)}
                  className={inputClass}
                  dir="ltr"
                />
              </div>

              {/* دسته‌بندی‌ها — مدل چیپ + آبشاری */}
              <div>
                <label className="block text-xs font-bold mb-1.5">دسته‌بندی‌ها</label>
                <div className="flex flex-wrap gap-1.5 mb-2 min-h-[8px]">
                  {form.categoryIds.map((id, idx) => {
                    const c = categoryById(id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 max-w-full px-2 py-1 rounded-lg bg-orange-50 border border-orange-200 text-xs"
                      >
                        <span className="truncate">{c?.name || id}</span>
                        {idx === 0 && (
                          <span className="text-[10px] bg-orange-500 text-white px-1.5 rounded-md">اصلی</span>
                        )}
                        <button
                          type="button"
                          onClick={() => removeCategory(id)}
                          className="text-orange-800 text-base leading-none px-0.5"
                          title="حذف"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
                <div className="border border-rose-100 rounded-xl p-3 bg-neutral-50 space-y-2">
                  <div className="text-xs text-neutral-500">انتخاب مسیر دسته</div>
                  {cascadeLevels.map((lvl) => (
                    <select
                      key={lvl.level}
                      value={lvl.value}
                      dir="rtl"
                      className={inputClass}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCatPath((prev) => {
                          const next = prev.slice(0, lvl.level);
                          if (v) next[lvl.level] = v;
                          return next;
                        });
                      }}
                    >
                      <option value="">انتخاب کنید</option>
                      {lvl.options.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ))}
                  <button
                    type="button"
                    onClick={addCategoryFromPath}
                    disabled={!catPath.length}
                    className="px-3 py-2 rounded-xl border border-orange-300 text-orange-700 text-xs font-bold hover:bg-orange-50 disabled:opacity-40"
                  >
                    + افزودن دسته
                  </button>
                </div>
              </div>

              {/* برند قابل جستجو */}
              <div ref={brandRef}>
                <label className="block text-xs font-bold mb-1.5">برند</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setBrandOpen((o) => !o)}
                    className={`${inputClass} flex items-center justify-between text-right`}
                  >
                    <span className={selectedBrand ? "text-ink" : "text-neutral-400"}>
                      {selectedBrand
                        ? `${selectedBrand.nameFa}${selectedBrand.nameEn ? ` | ${selectedBrand.nameEn}` : ""}`
                        : "انتخاب برند..."}
                    </span>
                    <span className="text-neutral-400 text-xs">▾</span>
                  </button>
                  {brandOpen && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-rose-100 rounded-xl shadow-lg overflow-hidden">
                      <div className="p-2">
                        <input
                          value={brandSearch}
                          onChange={(e) => setBrandSearch(e.target.value)}
                          placeholder="جستجو برند..."
                          dir="rtl"
                          className={inputClass}
                          autoFocus
                        />
                      </div>
                      <div className="max-h-48 overflow-y-auto p-1">
                        <button
                          type="button"
                          className="w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-rose-50 text-neutral-400"
                          onClick={() => {
                            set("brandId", "");
                            setBrandOpen(false);
                          }}
                        >
                          بدون برند
                        </button>
                        {filteredBrands.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            className={`w-full text-right px-3 py-2 text-sm rounded-lg hover:bg-orange-50 ${
                              form.brandId === b.id ? "bg-orange-50 font-bold" : ""
                            }`}
                            onClick={() => {
                              set("brandId", b.id);
                              setBrandOpen(false);
                              setBrandSearch("");
                            }}
                          >
                            {b.nameFa}
                            {b.nameEn ? ` | ${b.nameEn}` : ""}
                          </button>
                        ))}
                        {filteredBrands.length === 0 && (
                          <div className="px-3 py-4 text-sm text-neutral-400 text-center">برندی پیدا نشد</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">وضعیت</label>
                  <select
                    value={form.status}
                    onChange={(e) => set("status", e.target.value as Product["status"])}
                    className={inputClass}
                    dir="rtl"
                  >
                    <option value="DRAFT">پیش‌نویس</option>
                    <option value="PUBLISHED">منتشر شده</option>
                    <option value="ARCHIVED">آرشیو</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">نشان</label>
                  <select
                    value={form.badge}
                    onChange={(e) => set("badge", e.target.value as ProductFormValues["badge"])}
                    className={inputClass}
                    dir="rtl"
                  >
                    <option value="">بدون نشان</option>
                    <option value="NEW">جدید</option>
                    <option value="BESTSELLER">پرفروش</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {tab === "images" && (
            <div className="space-y-3">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
                }}
                className={`border-2 border-dashed rounded-2xl p-6 text-center ${
                  dragOver ? "border-rose-400 bg-rose-50" : "border-rose-100"
                }`}
              >
                <p className="text-sm text-neutral-500 mb-2">تصاویر را اینجا رها کنید یا انتخاب کنید</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold"
                >
                  انتخاب فایل
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)}
                />
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {form.images.map((src, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-rose-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-0 bottom-0 flex gap-1 p-1 bg-black/40">
                      {idx !== 0 && (
                        <button type="button" onClick={() => makeMain(idx)} className="flex-1 text-[10px] text-white">
                          اصلی
                        </button>
                      )}
                      <button type="button" onClick={() => removeImage(idx)} className="flex-1 text-[10px] text-rose-200">
                        حذف
                      </button>
                    </div>
                    {idx === 0 && (
                      <span className="absolute top-1 right-1 text-[10px] bg-rose-600 text-white px-1.5 rounded">اصلی</span>
                    )}
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">ویدیو (URL)</label>
                <input value={form.video} onChange={(e) => set("video", e.target.value)} dir="ltr" className={inputClass} />
              </div>
            </div>
          )}

          {tab === "price" && (
            <div className="grid sm:grid-cols-2 gap-3 max-w-xl">
              <div>
                <label className="block text-xs font-bold mb-1.5">قیمت (تومان)</label>
                <input value={form.price} onChange={(e) => set("price", e.target.value)} inputMode="numeric" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">قیمت قبل تخفیف</label>
                <input value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} inputMode="numeric" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">موجودی واقعی</label>
                <input value={form.stock} onChange={(e) => set("stock", e.target.value)} inputMode="numeric" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">نمایش موجودی (اختیاری)</label>
                <input
                  value={form.displayStockOverride}
                  onChange={(e) => set("displayStockOverride", e.target.value)}
                  inputMode="numeric"
                  className={inputClass}
                  placeholder="خالی = همان موجودی واقعی"
                />
              </div>
            </div>
          )}

          {tab === "colors" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={form.color}
                  onChange={(e) => set("color", e.target.value)}
                  className={inputClass}
                  placeholder="نام رنگ جدید"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!form.color.trim()) return;
                    if (form.colors.includes(form.color.trim())) return;
                    set("colors", [...form.colors, form.color.trim()]);
                    set("color", "");
                  }}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-bold shrink-0"
                >
                  افزودن
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.colors.map((c) => (
                  <span key={c} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-sm">
                    {c}
                    <button type="button" onClick={() => set("colors", form.colors.filter((x) => x !== c))}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {tab === "description" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold mb-1.5">توضیح متنی</label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  rows={5}
                  className={`${inputClass} resize-y`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">HTML توضیحات (اختیاری)</label>
                <textarea
                  value={form.descriptionHtml}
                  onChange={(e) => set("descriptionHtml", e.target.value)}
                  rows={6}
                  dir="ltr"
                  className={`${inputClass} resize-y font-mono text-xs`}
                />
              </div>
            </div>
          )}

          {tab === "attributes" && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">گروه‌های مشخصات فنی (مثلاً پردازنده، حافظه، ...)</p>
              {form.attributes.map((g, gi) => (
                <div key={gi} className="border border-rose-100 rounded-xl p-3 space-y-2">
                  <input
                    value={g.name}
                    onChange={(e) => {
                      const attributes = form.attributes.map((x, i) =>
                        i === gi ? { ...x, name: e.target.value } : x
                      );
                      set("attributes", attributes);
                    }}
                    className={inputClass}
                    placeholder="نام گروه"
                  />
                  {g.items.map((it, ii) => (
                    <div key={ii} className="grid grid-cols-2 gap-2">
                      <input
                        value={it.name}
                        onChange={(e) => {
                          const attributes = form.attributes.map((x, i) => {
                            if (i !== gi) return x;
                            const items = x.items.map((y, j) =>
                              j === ii ? { ...y, name: e.target.value } : y
                            );
                            return { ...x, items };
                          });
                          set("attributes", attributes);
                        }}
                        className={inputClass}
                        placeholder="ویژگی"
                      />
                      <input
                        value={it.value}
                        onChange={(e) => {
                          const attributes = form.attributes.map((x, i) => {
                            if (i !== gi) return x;
                            const items = x.items.map((y, j) =>
                              j === ii ? { ...y, value: e.target.value } : y
                            );
                            return { ...x, items };
                          });
                          set("attributes", attributes);
                        }}
                        className={inputClass}
                        placeholder="مقدار"
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    className="text-xs text-rose-600 font-bold"
                    onClick={() => {
                      const attributes = form.attributes.map((x, i) =>
                        i === gi ? { ...x, items: [...x.items, { name: "", value: "" }] } : x
                      );
                      set("attributes", attributes);
                    }}
                  >
                    + ویژگی
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-sm text-rose-600 font-bold"
                onClick={() =>
                  set("attributes", [...form.attributes, { name: "گروه جدید", items: [{ name: "", value: "" }] }])
                }
              >
                + گروه مشخصات
              </button>
            </div>
          )}

          {tab === "datasource" && (
            <div className="space-y-4">
              <div className="bg-amber-50 rounded-xl p-3 text-xs text-neutral-600">
                منبع اسکرپر را انتخاب کنید، آدرس محصول را وارد کنید و اطلاعات را دریافت کنید. منابع از «تنظیمات اسکرپر» مدیریت می‌شوند.
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">منبع اطلاعات</label>
                <select
                  value={form.sourceType}
                  onChange={(e) => set("sourceType", e.target.value)}
                  className={inputClass}
                  dir="rtl"
                >
                  <option value="">انتخاب کنید...</option>
                  {scraperSources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.baseUrl ? ` — ${s.baseUrl}` : ""}
                    </option>
                  ))}
                  <option value="custom">سایر / URL مستقیم</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5">آدرس URL محصول</label>
                <input
                  value={form.sourceUrl}
                  onChange={(e) => set("sourceUrl", e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                  className={inputClass}
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-bold">
                <input
                  type="checkbox"
                  checked={form.crawlerEnabled}
                  onChange={(e) => set("crawlerEnabled", e.target.checked)}
                />
                کرالر این محصول فعال باشد
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1.5">مارک‌آپ قیمت (%)</label>
                  <input
                    value={form.priceMarkupPercent}
                    onChange={(e) => set("priceMarkupPercent", e.target.value)}
                    className={inputClass}
                    inputMode="numeric"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5">مارک‌آپ تخفیف (%)</label>
                  <input
                    value={form.discountMarkupPercent}
                    onChange={(e) => set("discountMarkupPercent", e.target.value)}
                    className={inputClass}
                    inputMode="numeric"
                  />
                </div>
              </div>
              <button
                type="button"
                disabled={scraping}
                onClick={handleScraperFetch}
                className="px-4 py-2.5 rounded-xl bg-rose-600 text-white font-bold disabled:opacity-60"
              >
                {scraping ? "در حال دریافت..." : "دریافت اطلاعات از سرویس"}
              </button>
              {scraperError && <div className="bg-rose-50 text-rose-600 rounded-xl p-3 text-xs">{scraperError}</div>}
              {scraperPreview && (
                <div className="border border-rose-100 rounded-xl p-4 space-y-3">
                  <div className="font-bold">پیش‌نمایش اطلاعات دریافت‌شده</div>
                  <div className="flex gap-3">
                    {scraperPreview.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={scraperPreview.image} alt="" className="w-20 h-20 rounded-lg object-cover" />
                    )}
                    <div className="text-xs">
                      <div className="font-bold">{scraperPreview.title || "بدون عنوان"}</div>
                      <div className="text-neutral-500 mt-1 line-clamp-3">
                        {scraperPreview.description || "توضیحی پیدا نشد"}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={importScraper}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-sm"
                  >
                    ورود اطلاعات به فرم
                  </button>
                </div>
              )}
            </div>
          )}

          {tab === "shipping" && (
            <div className="space-y-3">
              <p className="text-xs text-neutral-500">
                روش‌های فعال به‌صورت پیش‌فرض انتخاب شده‌اند. برای محدود کردن، تیک‌ها را تغییر دهید. اگر همه را بردارید، هنگام ذخیره دوباره همه روش‌های فعال اعمال می‌شود.
              </p>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {shippingMethods
                  .filter((m) => m.active)
                  .map((m) => {
                    const checked = form.shippingMethodIds.includes(m.id);
                    return (
                      <label
                        key={m.id}
                        className="flex items-center gap-2 text-sm border border-rose-100 rounded-xl px-3 py-2"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            const next = checked
                              ? form.shippingMethodIds.filter((id) => id !== m.id)
                              : [...form.shippingMethodIds, m.id];
                            set("shippingMethodIds", next);
                          }}
                        />
                        {m.name}
                      </label>
                    );
                  })}
                {shippingMethods.filter((m) => m.active).length === 0 && (
                  <div className="text-sm text-neutral-400">
                    روش ارسال فعالی تعریف نشده. از بخش «روش‌های ارسال» اضافه کنید.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end p-4 border-t border-rose-100 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-rose-100 text-sm font-bold"
          >
            لغو
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form)}
            className="px-6 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold disabled:opacity-60"
          >
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </div>
    </div>
  );
}
