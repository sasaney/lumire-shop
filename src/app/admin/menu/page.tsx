"use client";

import { useEffect, useState } from "react";
import type { Category, MenuItem } from "@/lib/types";
import AdminTree, { type TreeNode } from "@/components/AdminTree";
import CategoryFormModal, { type CategoryFormValues } from "@/components/CategoryFormModal";

export default function AdminMenuPage() {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState<{ mode: "create" | "edit"; id?: string; parentId: string | null } | null>(null);

  async function load() {
    const [menuRes, catRes] = await Promise.all([fetch("/api/admin/menu"), fetch("/api/admin/categories")]);
    setMenu((await menuRes.json()).menu || []);
    setCategories((await catRes.json()).categories || []);
  }
  useEffect(() => { load(); }, []);

  function openEdit(id: string) { const m = menu.find((x) => x.id === id); if (m) setModal({ mode: "edit", id, parentId: m.parentId || null }); }

  async function handleSave(values: CategoryFormValues) {
    setSaving(true);
    try {
      const body = {
        label: values.name.trim(),
        nameEn: values.nameEn.trim() || undefined,
        icon: values.icon.trim() || undefined,
        wcCategoryId: values.wcCategoryId || null,
        link: values.link.trim() || (values.wcCategoryId ? `/products?category=${values.wcCategoryId}` : "#"),
        order: Number(values.order) || 0,
        isActive: values.isActive,
        parentId: modal?.parentId || null,
      };
      const url = modal?.mode === "edit" ? `/api/admin/menu/${modal.id}` : "/api/admin/menu";
      await fetch(url, { method: modal?.mode === "edit" ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      setModal(null); await load();
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) { if (!confirm("این آیتم منو حذف شود؟")) return; await fetch(`/api/admin/menu/${id}`, { method: "DELETE" }); load(); }

  async function handleReorder(draggedId: string, targetId: string) {
    const dragged = menu.find((m) => m.id === draggedId); const target = menu.find((m) => m.id === targetId); if (!dragged || !target) return;
    const newParentId = target.parentId || null;
    const siblings = menu.filter((m) => (m.parentId || null) === newParentId && m.id !== draggedId).sort((a, b) => a.order - b.order);
    const targetIdx = siblings.findIndex((m) => m.id === targetId); siblings.splice(targetIdx + 1, 0, dragged);
    await Promise.all(siblings.map((m, i) => fetch(`/api/admin/menu/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: i + 1, parentId: newParentId }) })));
    load();
  }

  function quickAddFromCategory(catId: string) {
    const cat = categories.find((c) => c.id === catId); if (!cat) return;
    setModal({ mode: "create", parentId: null });
    // اطلاعات دسته انتخاب‌شده در create از طریق state جداگانه نگهداری می‌شود؛ برای سادگی کاربر می‌تواند دسته را در فرم انتخاب کند.
  }

  const nodes: TreeNode[] = menu.map((m) => ({ id: m.id, label: m.label, sublabel: `${m.isActive === false ? "غیرفعال • " : ""}${m.link !== "#" ? m.link : "بدون لینک"}`, parentId: m.parentId || null, order: m.order }));
  const activeModalMenu = modal?.mode === "edit" ? menu.find((m) => m.id === modal.id) : undefined;
  const usedLinks = new Set(menu.map((m) => m.link));
  const availableCategories = categories.filter((c) => !usedLinks.has(`/products?category=${c.id}`));

  return (
    <div className="space-y-5">
      <div><h1 className="text-xl font-extrabold">دسته‌بندی‌های منوی سایت</h1><p className="text-sm text-neutral-500 mt-1">دسته‌های نمایشی در مگامنو و ناوبری سایت را با نام، آیکون، دسته محصول، لینک، ترتیب و وضعیت فعال مدیریت کنید.</p></div>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => setModal({ mode: "create", parentId: null })} className="px-4 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700">+ دسته‌بندی جدید</button>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی نام دسته‌بندی" className="flex-1 min-w-[180px] px-4 py-2.5 rounded-xl border border-rose-100 text-sm outline-none" />
        {availableCategories.length > 0 && <select defaultValue="" onChange={(e) => { if (!e.target.value) return; const c = categories.find((x) => x.id === e.target.value); if (!c) return; setModal({ mode: "create", parentId: null }); e.target.value = ""; }} className="px-4 py-2.5 rounded-xl border border-rose-100 text-sm"><option value="">+ افزودن سریع از دسته‌بندی...</option>{availableCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>}
      </div>
      <div className="bg-white border border-rose-100 rounded-2xl p-3"><p className="text-xs text-neutral-400 px-2 pb-2">برای تغییر ترتیب نمایش، آیتم‌های هم‌سطح را با کشیدن (⠿) جابجا کنید.</p><AdminTree nodes={nodes} search={search} onReorder={handleReorder} onAddChild={(parentId) => setModal({ mode: "create", parentId })} onRename={openEdit} onDelete={handleDelete} /></div>
      {modal && <CategoryFormModal title={modal.mode === "edit" ? "ویرایش دسته‌بندی منو" : modal.parentId ? "افزودن زیرمجموعه به منو" : "دسته‌بندی جدید منو"} parentId={modal.parentId} categories={categories} saving={saving} initial={activeModalMenu ? { name: activeModalMenu.label, nameEn: activeModalMenu.nameEn || "", icon: activeModalMenu.icon || "", wcCategoryId: activeModalMenu.wcCategoryId || "", link: activeModalMenu.link || "", order: String(activeModalMenu.order || 0), isActive: activeModalMenu.isActive !== false } : undefined} onClose={() => setModal(null)} onSave={handleSave} />}
    </div>
  );
}
