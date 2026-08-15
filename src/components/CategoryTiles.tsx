import Link from "next/link";
import { database } from "@/lib/db";

const icons: Record<string, string> = {
  skincare: "🧴",
  makeup: "💄",
  haircare: "💇‍♀️",
  hygiene: "🪥",
  perfume: "🌸",
  baby: "🍼",
};

export default async function CategoryTiles() {
  const db = await database.read();
  const topLevel = db.categories.filter((c) => !c.parentId).slice(0, 6);

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-xl font-extrabold mb-5">دسته‌بندی‌های محبوب</h2>
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {topLevel.map((c) => (
          <Link
            key={c.id}
            href={`/?category=${c.id}`}
            className="flex flex-col items-center gap-2 bg-white border border-[#EFE8E1] rounded-2xl p-4 hover:border-[#D4AF37]/50 hover:shadow-md hover:shadow-rose-100 transition text-center"
          >
            <span className="text-3xl">{icons[c.slug] || "🛍️"}</span>
            <span className="text-xs font-bold leading-5">{c.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
