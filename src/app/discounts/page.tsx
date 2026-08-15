import { database } from "@/lib/db";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function DiscountsPage() {
  const db = await database.read();
  const products = db.products.filter(
    (p) => p.status === "PUBLISHED" && p.compareAtPrice !== null && p.compareAtPrice > p.price
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-extrabold mb-1">🔥 تخفیف‌های ویژه</h1>
      <p className="text-neutral-500 text-sm mb-6">{products.length} محصول تخفیف‌دار</p>

      {products.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">در حال حاضر تخفیفی فعال نیست.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
