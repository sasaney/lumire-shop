"use client";

import { useState } from "react";

export interface TreeNode {
  id: string;
  label: string;
  sublabel?: string; // e.g. URL path shown in gray under the label
  parentId: string | null;
  order: number;
}

export default function AdminTree({
  nodes,
  search,
  onReorder,
  onAddChild,
  onRename,
  onDelete,
}: {
  nodes: TreeNode[];
  search?: string;
  onReorder: (draggedId: string, targetId: string) => void;
  onAddChild: (parentId: string | null) => void;
  onRename: (id: string, currentLabel: string) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const q = (search || "").trim().toLowerCase();
  const matches = (n: TreeNode) => !q || n.label.toLowerCase().includes(q);
  // اگر جستجو فعال است، همه گره‌ها باز نمایش داده شوند تا نتیجه گم نشود
  const forceExpand = Boolean(q);

  function childrenOf(parentId: string | null) {
    return nodes
      .filter((n) => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }

  function subtreeMatches(n: TreeNode): boolean {
    if (matches(n)) return true;
    return childrenOf(n.id).some(subtreeMatches);
  }

  function renderNode(node: TreeNode, depth: number) {
    if (q && !subtreeMatches(node)) return null;
    const children = childrenOf(node.id);
    const isCollapsed = !forceExpand && collapsed[node.id];

    return (
      <div key={node.id}>
        <div
          draggable
          onDragStart={() => setDragId(node.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId && dragId !== node.id) onReorder(dragId, node.id);
            setDragId(null);
          }}
          className="group flex items-center gap-2 py-2.5 border-b border-rose-50 hover:bg-rose-50/50 rounded-lg px-2"
          style={{ paddingRight: depth * 28 }}
        >
          <span className="cursor-grab text-neutral-300 select-none">⠿</span>

          {children.length > 0 ? (
            <button
              onClick={() => setCollapsed((c) => ({ ...c, [node.id]: !c[node.id] }))}
              className="text-neutral-400 w-5 text-xs"
            >
              {isCollapsed ? "▸" : "▾"}
            </button>
          ) : (
            <span className="w-5" />
          )}

          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm truncate">{node.label}</div>
            {node.sublabel && (
              <div className="text-xs text-neutral-400 truncate" dir="ltr">
                {node.sublabel}
              </div>
            )}
          </div>

          <div className="relative shrink-0">
            <button
              onClick={() => setOpenMenu((m) => (m === node.id ? null : node.id))}
              className="w-7 h-7 rounded-lg hover:bg-rose-100 text-neutral-400 text-sm"
            >
              ⋮
            </button>
            {openMenu === node.id && (
              <div className="absolute left-0 top-8 z-20 bg-white border border-rose-100 rounded-xl shadow-lg py-1 w-40 text-sm">
                <button
                  onClick={() => {
                    onRename(node.id, node.label);
                    setOpenMenu(null);
                  }}
                  className="w-full text-right px-3 py-2 hover:bg-rose-50"
                >
                  ویرایش نام
                </button>
                <button
                  onClick={() => {
                    onAddChild(node.id);
                    setOpenMenu(null);
                  }}
                  className="w-full text-right px-3 py-2 hover:bg-rose-50"
                >
                  افزودن زیرمجموعه
                </button>
                <button
                  onClick={() => {
                    onDelete(node.id);
                    setOpenMenu(null);
                  }}
                  className="w-full text-right px-3 py-2 hover:bg-rose-50 text-rose-600"
                >
                  حذف
                </button>
              </div>
            )}
          </div>
        </div>

        {!isCollapsed && (
          <div>
            {children.map((c) => renderNode(c, depth + 1))}
            <button
              onClick={() => onAddChild(node.id)}
              className="text-xs text-rose-600 font-bold hover:underline py-1.5 block"
              style={{ paddingRight: (depth + 1) * 28 + 24 }}
            >
              + ایجاد زیرمجموعه
            </button>
          </div>
        )}
      </div>
    );
  }

  const roots = childrenOf(null);

  return (
    <div onClick={() => openMenu && setOpenMenu(null)}>
      {roots.length === 0 ? (
        <div className="text-sm text-neutral-400 py-6 text-center">موردی ثبت نشده.</div>
      ) : (
        roots.map((n) => renderNode(n, 0))
      )}
    </div>
  );
}
