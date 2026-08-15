"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TopSearchBar() {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(value.trim() ? `/?q=${encodeURIComponent(value.trim())}` : "/");
  }

  return (
    <div className="bg-white border-b border-rose-100">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400">🔍</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="دنبال چه محصولی می‌گردید؟"
              className="w-full pr-11 pl-4 py-3 rounded-xl border border-rose-100 focus-ring outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-rose-600 text-white text-sm font-bold hover:bg-rose-700 transition shrink-0"
          >
            جستجو
          </button>
        </form>
      </div>
    </div>
  );
}
