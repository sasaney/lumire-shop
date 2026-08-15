import type { TrustBadgeItem } from "@/lib/types";
import { defaultTrustBadges } from "@/lib/types";

export default function TrustBadges({ items }: { items?: TrustBadgeItem[] }) {
  const list = items && items.length > 0 ? items : defaultTrustBadges();
  return (
    <section className="bg-white border-b border-[#EFE8E1]">
      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {list.map((it) => (
          <div key={it.id} className="flex items-center gap-3 p-2 sm:p-0">
            <span className="w-11 h-11 shrink-0 rounded-full bg-[#F7EFE9] flex items-center justify-center text-xl">
              {it.icon}
            </span>
            <div className="min-w-0">
              <div className="font-bold text-sm">{it.title}</div>
              <div className="text-xs text-neutral-400 leading-5">{it.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
