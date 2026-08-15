"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Category } from "@/lib/types";

function categoryHref(c: Category) {
  if (c.link) return c.link;
  return `/?category=${c.wcCategoryId || c.id}`;
}

export default function CategoryMenu({
  variant = "desktop",
  onNavigate,
}: {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (variant !== "desktop") return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [variant]);

  const active = categories
    .filter((c) => c.isActive !== false && c.showInMenu !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
  const parents = active.filter((c) => !c.parentId);
  const childrenOf = (id: string) => active.filter((c) => c.parentId === id);

  if (variant === "mobile") {
    return (
      <div className="space-y-1">
        <div className="text-xs font-bold text-neutral-400 px-1 pt-1 pb-2">دسته‌بندی محصولات</div>
        {parents.length === 0 && (
          <div className="text-sm text-neutral-400 px-1 py-2">دسته‌بندی‌ای تعریف نشده.</div>
        )}
        {parents.map((c) => {
          const kids = childrenOf(c.id);
          const isOpen = expanded[c.id];
          return (
            <div key={c.id} className="rounded-xl overflow-hidden">
              <div className="flex items-center gap-1">
                <Link
                  href={categoryHref(c)}
                  onClick={onNavigate}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-50 hover:text-rose-600 transition"
                >
                  {c.icon ? `${c.icon} ` : ""}
                  {c.name}
                </Link>
                {kids.length > 0 && (
                  <button
                    type="button"
                    aria-label="زیرمجموعه‌ها"
                    onClick={() => setExpanded((e) => ({ ...e, [c.id]: !e[c.id] }))}
                    className="w-9 h-9 rounded-lg text-neutral-400 hover:bg-rose-50"
                  >
                    {isOpen ? "▴" : "▾"}
                  </button>
                )}
              </div>
              {kids.length > 0 && isOpen && (
                <div className="pr-4 mr-2 border-r border-rose-100 space-y-0.5 pb-1">
                  {kids.map((sub) => (
                    <Link
                      key={sub.id}
                      href={categoryHref(sub)}
                      onClick={onNavigate}
                      className="block px-3 py-2 rounded-lg text-sm text-neutral-600 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 hover:text-rose-600 transition"
        aria-expanded={open}
      >
        دسته‌بندی محصولات
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-3 w-80 bg-white border border-rose-100 rounded-2xl shadow-xl p-3 z-50 max-h-[70vh] overflow-y-auto">
          {parents.length === 0 && (
            <div className="text-sm text-neutral-400 px-2 py-3">دسته‌بندی‌ای تعریف نشده.</div>
          )}
          {parents.map((c) => (
            <div key={c.id} className="mb-1">
              <Link
                href={categoryHref(c)}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-lg font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition"
              >
                {c.icon ? `${c.icon} ` : ""}
                {c.name}
              </Link>
              {childrenOf(c.id).length > 0 && (
                <div className="pr-4 border-r border-rose-100 mr-3">
                  {childrenOf(c.id).map((sub) => (
                    <Link
                      key={sub.id}
                      href={categoryHref(sub)}
                      onClick={() => setOpen(false)}
                      className="block px-3 py-1.5 rounded-lg text-xs text-neutral-500 hover:bg-rose-50 hover:text-rose-600 transition"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
