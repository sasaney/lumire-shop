"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/lib/types";
import AdminTree, { type TreeNode } from "@/components/AdminTree";
import CategoryFormModal, { type CategoryFormValues } from "@/components/CategoryFormModal";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<"all" | "root">("all");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string; parentId: string | null } | null>(null);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  }

  useEffect(() => { load(); }, []);

  function openCreate(parentId: string | null) { setModal({ mode: "create", parentId }); }
  function openEdit(id: string) {
    const c = categories.find((x) => x.id === id);
    if (c) setModal({ mode: "edit", id, parentId: c.parentId || null });
  }

  async function handleSave(values: CategoryFormValues) {
    setSaving(true);
    try {
      const body = {
        name: values.name.trim(),
        nameEn: values.nameEn.trim() || undefined,
        icon: values.icon.trim() || undefined,
        wcCategoryId: values.wcCategoryId || null,
        link: values.link.trim() || (values.wcCategoryId ? `/products?category=${values.wcCategoryId}` : null),
        order: Number(values.order) || 0,
        isActive: values.isActive,
        parentId: modal?.parentId || null,
      };
      const url = modal?.mode === "edit" ? `/api/admin/categories/${modal.id}` : "/api/admin/categories";
      await fetch(url, { method: modal?.mode === "edit" ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setModal(null);
      await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("این دسته‌بندی حذف شود؟")) return;
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) return alert(data.error);
    load();
  }

  async function handleReorder(draggedId: string, targetId: string) {
    const dragged = categories.find((c) => c.id === draggedId);
    const target = categories.find((c) => c.id === targetId);
    if (!dragged || !target) return;
    const newParentId = target.parentId || null;
    const siblings = categories.filter((c) => (c.parentId || null) === newParentId && c.id !== draggedId).sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetIdx = siblings.findIndex((c) => c.id === targetId);
    siblings.splice(targetIdx + 1, 0, dragged);
    await Promise.all(siblings.map((c, i) => fetch(`/api/admin/categories/${c.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: i + 1, parentId: newParentId }) })));
    load();
  }

  const nodes: TreeNode[] = categories
    .filter((c) => (scope === "root" ? !c.parentId : true))
    .map((c) => ({ id: c.id, label: c.name, sublabel: c.link || c.wcCategoryId || undefined, parentId: scope === "root" ? null : c.parentId || null, order: c.order ?? 0 }));

  const activeModalCategory = modal?.mode === "edit" ? categories.find((c) => c.id === modal.id) : undefined;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold">مدیریت دسته‌بندی‌های محصولات</h1>
        <p className="text-sm text-neutral-500 mt-1">دسته‌های اصلی و زیرمجموعه‌ها، اتصال به دسته محصول، لینک، ترتیب و وضعیت فعال را مدیریت کنید.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => openCreate(null)} className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">+ دسته‌بندی جدید</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام دسته‌بندی" className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-rose-100 text-sm outline-none" />
        <select value={scope} onChange={(e) => setScope(e.target.value as "all" | "root")} className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm">
          <option value="all">همه دسته‌بندی‌ها</option><option value="root">فقط دسته‌های اصلی</option>
        </select>
      </div>

      <div className="bg-white border border-rose-100 rounded-2xl p-3">
        <p className="text-xs text-neutral-400 px-2 pb-2">برای تغییر ترتیب، آیتم‌های هم‌سطح را با کشیدن (⠿) جابجا کنید. برای مشاهده و ویرایش همه اطلاعات، منوی ⋮ را باز کنید.</p>
        <AdminTree nodes={nodes} search={search} onReorder={handleReorder} onAddChild={openCreate} onRename={openEdit} onDelete={handleDelete} />
      </div>

      {modal && (
        <CategoryFormModal
          title={modal.mode === "edit" ? "ویرایش دسته‌بندی" : modal.parentId ? "افزودن زیرمجموعه" : "دسته‌بندی جدید"}
          parentId={modal.parentId}
          categories={categories}
          saving={saving}
          initial={activeModalCategory ? { name: activeModalCategory.name, nameEn: activeModalCategory.nameEn || "", icon: activeModalCategory.icon || "", wcCategoryId: activeModalCategory.wcCategoryId || "", link: activeModalCategory.link || "", order: String(activeModalCategory.order || 0), isActive: activeModalCategory.isActive !== false } : undefined}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
