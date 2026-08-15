"use client";

import { useEffect, useState } from "react";
import type { Brand, Category, Product, ProductStatus } from "@/lib/types";
import { toman } from "@/lib/order-status";
import dynamic from "next/dynamic";
import { type ProductFormValues, generateProductCodes } from "@/components/ProductFormModal";

const ProductFormModal = dynamic(() => import("@/components/ProductFormModal"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-2xl px-6 py-4 text-sm text-neutral-500">در حال بارگذاری فرم...</div>
    </div>
  ),
});

const emptyForm: ProductFormValues = {
  code: "",
  sku: "",
  title: "",
  titleEn: "",
  categoryIds: [],
  brandId: "",
  status: "PUBLISHED",
  badge: "",
  images: [],
  video: "",
  price: "",
  compareAtPrice: "",
  color: "",
  colors: [],
  weightGrams: "",
  lengthCm: "",
  widthCm: "",
  heightCm: "",
  warranties: [],
  attributes: [],
  commissionPercent: "",
  sourceType: "",
  stock: "",
  displayStockOverride: "",
  description: "",
  descriptionHtml: "",
  sourceUrl: "",
  crawlerEnabled: false,
  priceMarkupPercent: "",
  discountMarkupPercent: "",
  shippingMethodIds: [],
};

const statusLabels: Record<ProductStatus, string> = {
  DRAFT: "پیش‌نویس",
  PUBLISHED: "منتشر شده",
  ARCHIVED: "آرشیو",
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [shippingMethods, setShippingMethods] = useState<{ id: string; name: string; active: boolean }[]>([]);
  const [scraperSources, setScraperSources] = useState<{ id: string; name: string; baseUrl?: string }[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formValues, setFormValues] = useState<ProductFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [filterCategory, setFilterCategory] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");

  async function load() {
    const res = await fetch("/api/products");
    const data = await res.json();
    setProducts(data.products || []);
    setCategories(data.categories || []);
    setBrands(data.brands || []);
    try {
      const sRes = await fetch("/api/admin/shipping");
      const sData = await sRes.json();
      setShippingMethods(sData.shippingMethods || []);
    } catch { setShippingMethods([]); }
    try {
      const scRes = await fetch("/api/admin/scraper/settings");
      const scData = await scRes.json();
      const sources = (scData.settings?.sources || []).filter((s: any) => s.active !== false);
      setScraperSources(sources);
    } catch { setScraperSources([]); }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    const codes = generateProductCodes();
    const activeShip = shippingMethods.filter((m) => m.active).map((m) => m.id);
    setFormValues({
      ...emptyForm,
      code: codes.code,
      sku: codes.sku,
      shippingMethodIds: activeShip,
      crawlerEnabled: true,
    });
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setFormValues({
      code: p.code || generateProductCodes().code,
      sku: p.sku || generateProductCodes().sku,
      title: p.title,
      titleEn: p.titleEn || "",
      categoryIds: p.categoryIds || [],
      brandId: p.brandId || "",
      status: p.status,
      badge: p.badge || "",
      images: p.images && p.images.length ? p.images : p.image ? [p.image] : [],
      video: p.video || "",
      price: String(p.price),
      compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
      color: p.color || "",
      colors: p.colors || (p.color ? [p.color] : []),
      weightGrams: p.weightGrams != null ? String(p.weightGrams) : "",
      lengthCm: p.lengthCm != null ? String(p.lengthCm) : "",
      widthCm: p.widthCm != null ? String(p.widthCm) : "",
      heightCm: p.heightCm != null ? String(p.heightCm) : "",
      warranties: p.warranties || [],
      attributes: p.attributes || [],
      commissionPercent: p.commissionPercent != null ? String(p.commissionPercent) : "",
      sourceType: p.sourceType || "",
      stock: String(p.stock),
      displayStockOverride:
        p.displayStockOverride !== null && p.displayStockOverride !== undefined
          ? String(p.displayStockOverride)
          : "",
      description: p.description,
      descriptionHtml: p.descriptionHtml || "",
      sourceUrl: p.sourceUrl || "",
      crawlerEnabled: p.crawlerEnabled !== false,
      priceMarkupPercent: p.priceMarkupPercent != null ? String(p.priceMarkupPercent) : "",
      discountMarkupPercent: p.discountMarkupPercent != null ? String(p.discountMarkupPercent) : "",
      shippingMethodIds: (p.shippingMethodIds && p.shippingMethodIds.length) ? p.shippingMethodIds : shippingMethods.filter((m) => m.active).map((m) => m.id),
    });
    setEditing(p.id);
    setShowForm(true);
  }

  async function handleSave(values: ProductFormValues) {
    setSaving(true);
    try {
      const payload = {
        code: values.code.trim() || null,
        title: values.title,
        titleEn: values.titleEn || null,
        sku: values.sku || null,
        categoryIds: values.categoryIds,
        brandId: values.brandId || null,
        status: values.status,
        badge: values.badge || null,
        images: values.images,
        video: values.video || null,
        color: values.color || (values.colors[0] || null),
        colors: values.colors,
        weightGrams: values.weightGrams ? Number(values.weightGrams) : null,
        lengthCm: values.lengthCm ? Number(values.lengthCm) : null,
        widthCm: values.widthCm ? Number(values.widthCm) : null,
        heightCm: values.heightCm ? Number(values.heightCm) : null,
        warranties: values.warranties.filter(Boolean),
        attributes: values.attributes,
        commissionPercent: values.commissionPercent ? Number(values.commissionPercent) : null,
        sourceType: values.sourceType || null,
        price: values.price,
        compareAtPrice: values.compareAtPrice || null,
        stock: values.stock,
        displayStockOverride: values.displayStockOverride,
        description: values.description,
        descriptionHtml: values.descriptionHtml || null,
        sourceUrl: values.sourceUrl || null,
        crawlerEnabled: values.crawlerEnabled && Boolean(values.sourceUrl.trim()),
        priceMarkupPercent: values.priceMarkupPercent ? Number(values.priceMarkupPercent) : null,
        discountMarkupPercent: values.discountMarkupPercent ? Number(values.discountMarkupPercent) : null,
        shippingMethodIds: values.shippingMethodIds.length ? values.shippingMethodIds : null,
      };
      if (editing) {
        await fetch(`/api/products/${editing}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleScrapeOne(p: Product) {
    if (!p.sourceUrl) {
      alert("برای این محصول لینک منبع ثبت نشده است.");
      return;
    }
    const res = await fetch("/api/admin/scraper/fetch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: p.sourceUrl,
        priceMarkupPercent: p.priceMarkupPercent ?? undefined,
        discountMarkupPercent: p.discountMarkupPercent ?? undefined,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "به‌روزرسانی ناموفق بود.");
      return;
    }
    const suggested = data.suggested || data.raw || {};
    await fetch(`/api/products/${p.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: suggested.title || p.title,
        description: suggested.description || p.description,
        descriptionHtml: suggested.descriptionHtml || p.descriptionHtml,
        images: suggested.images?.length ? suggested.images : p.images,
        image: suggested.image || p.image,
        price: suggested.price != null ? suggested.price : p.price,
        compareAtPrice: suggested.compareAtPrice != null ? suggested.compareAtPrice : p.compareAtPrice,
        lastScrapedAt: new Date().toISOString(),
      }),
    });
    await load();
  }

  async function handleDelete(id: string) {
    if (!confirm("این محصول حذف شود؟")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    await load();
  }

  function exportCsv() {
    const header = ["عنوان", "قیمت", "قیمت قبل تخفیف", "موجودی واقعی", "وضعیت"];
    const rows = filtered.map((p) => [
      p.title,
      p.price,
      p.compareAtPrice ?? "",
      p.stock,
      statusLabels[p.status],
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products.csv";
    a.click();
  }

  const filtered = products.filter((p) => {
    if (filterCategory && !p.categoryIds.includes(filterCategory)) return false;
    if (filterBrand && p.brandId !== filterBrand) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.id.includes(search))
      return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-extrabold">محصولات</h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm font-bold hover:bg-rose-50 transition"
          >
            خروجی CSV
          </button>
          <button
            onClick={openNew}
            className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition"
          >
            + محصول جدید
          </button>
        </div>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-4 grid sm:grid-cols-4 gap-3">
        <input
          placeholder="جستجو بر اساس نام یا کد کالا"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="px-3 py-2 rounded-lg border border-rose-100 text-sm focus-ring outline-none"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 rounded-lg border border-rose-100 text-sm"
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="px-3 py-2 rounded-lg border border-rose-100 text-sm"
        >
          <option value="">همه برندها</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>{b.nameFa}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg border border-rose-100 text-sm"
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(statusLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <ProductFormModal
          shippingMethods={shippingMethods}
          scraperSources={scraperSources}
          categories={categories}
          brands={brands}
          initial={formValues}
          saving={saving}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
        />
      )}

      <div className="bg-white border border-rose-100 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-sm min-w-[1180px]">
          <thead className="bg-rose-50 text-neutral-600">
            <tr>
              <th className="text-center p-3 w-16">#</th>
              <th className="text-right p-3">تصویر محصول</th>
              <th className="text-right p-3">عنوان کالا</th>
              <th className="text-right p-3">کد کالا</th>
              <th className="text-right p-3">دسته‌بندی</th>
              <th className="text-right p-3">برند</th>
              <th className="text-right p-3">قیمت (تومان)</th>
              <th className="text-right p-3">موجودی</th>
              <th className="text-right p-3">وضعیت کالا</th>
              <th className="text-right p-3">فعال‌سازی</th>
              <th className="text-right p-3">کرالر</th>
              <th className="text-right p-3">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, index) => {
              const categoryNames = p.categoryIds
                .map((id) => categories.find((c) => c.id === id)?.name)
                .filter(Boolean)
                .join("، ");
              const brand = brands.find((b) => b.id === p.brandId);
              const active = p.status === "PUBLISHED";
              const crawlerActive = Boolean(p.sourceUrl) && p.crawlerEnabled !== false;

              async function toggleActivation() {
                const nextStatus = active ? "DRAFT" : "PUBLISHED";
                await fetch(`/api/products/${p.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: nextStatus }),
                });
                await load();
              }

              async function toggleCrawler() {
                if (!p.sourceUrl) {
                  alert("برای فعال‌کردن کرالر ابتدا URL محصول را در ویرایش محصول وارد کنید.");
                  openEdit(p);
                  return;
                }
                await fetch(`/api/products/${p.id}`, {
                  method: "PUT",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ crawlerEnabled: !crawlerActive }),
                });
                await load();
              }

              return (
                <tr key={p.id} className="border-t border-rose-50 hover:bg-rose-50/30">
                  <td className="p-3 text-center text-neutral-400">{index + 1}</td>
                  <td className="p-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover bg-rose-50" />
                  </td>
                  <td className="p-3 font-bold max-w-[240px]">
                    <span className="line-clamp-2">{p.title}</span>
                  </td>
                  <td className="p-3 font-mono text-xs text-neutral-500" dir="ltr">{p.code || p.id}</td>
                  <td className="p-3 text-neutral-600 max-w-[180px]">{categoryNames || "—"}</td>
                  <td className="p-3 font-semibold">{brand ? `${brand.nameFa}${brand.nameEn ? ` | ${brand.nameEn}` : ""}` : "—"}</td>
                  <td className="p-3 whitespace-nowrap font-bold">{toman(p.price)}</td>
                  <td className="p-3">
                    <span className={p.stock <= 5 ? "text-rose-600 font-bold" : "font-semibold"}>{p.stock}</span>
                  </td>
                  <td className="p-3">
                    <span className={`badge ${p.stock > 0 ? "badge-instock" : "badge-outofstock"}`}>
                      {p.stock > 0 ? "فعال" : "ناموجود"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={toggleActivation} className={`relative w-11 h-6 rounded-full transition ${active ? "bg-sage-500" : "bg-neutral-300"}`} aria-label="فعال‌سازی">
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${active ? "right-1" : "left-1"}`} />
                    </button>
                  </td>
                  <td className="p-3">
                    <button onClick={toggleCrawler} className={`relative w-11 h-6 rounded-full transition ${crawlerActive ? "bg-sage-500" : "bg-neutral-300"}`} aria-label="کرالر">
                      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition ${crawlerActive ? "right-1" : "left-1"}`} />
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1.5 justify-end items-center sticky-actions">
                      <button
                        type="button"
                        title="اسکرپ و به‌روزرسانی همین محصول"
                        onClick={() => handleScrapeOne(p)}
                        className="w-9 h-9 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-600 font-bold text-sm disabled:opacity-30"
                        disabled={!p.sourceUrl}
                      >
                        ↻
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="h-9 px-3 rounded-xl bg-sage-50 text-sage-700 text-xs font-bold hover:bg-sage-100"
                      >
                        جزئیات
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(p.id)}
                        className="w-9 h-9 rounded-xl border border-rose-100 hover:bg-rose-50 text-rose-600 text-sm"
                        title="حذف"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={12} className="p-10 text-center text-neutral-400">محصولی پیدا نشد.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
