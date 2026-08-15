export const revalidate = 30;

import Link from "next/link";
import { database } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import TopSearchBar from "@/components/TopSearchBar";
import CategoryTiles from "@/components/CategoryTiles";
import DiscountCarousel from "@/components/DiscountCarousel";
import TrustBadges from "@/components/TrustBadges";
import Testimonials from "@/components/Testimonials";
import HeroSlider from "@/components/HeroSlider";
import { defaultLandingSections } from "@/lib/types";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const { category, q } = await searchParams;
  const db = await database.read();

  let products = db.products.filter((p) => p.status === "PUBLISHED");
  if (category) products = products.filter((p) => p.categoryIds.includes(category));
  if (q) products = products.filter((p) => p.title.toLowerCase().includes(q.toLowerCase()));
  // سقف نرم برای رندر اولیه (صفحه اول بدون فیلتر)
  const PAGE_PRODUCT_LIMIT = 48;
  const totalMatched = products.length;
  if (!category && !q && products.length > PAGE_PRODUCT_LIMIT) {
    products = products.slice(0, PAGE_PRODUCT_LIMIT);
  }

  const activeCategory = db.categories.find((c) => c.id === category);
  const isFiltered = Boolean(category || q);
  const activeSlides = (db.settings.slides || [])
    .filter((s) => s.active)
    .sort((a, b) => a.priority - b.priority);

  const sections = (db.settings.landingSections?.length
    ? db.settings.landingSections
    : defaultLandingSections()
  )
    .filter((s) => s.active)
    .sort((a, b) => a.order - b.order);

  function renderHero() {
    if (activeSlides.length > 0) {
      return <HeroSlider slides={activeSlides} />;
    }
    return (
      <section className="relative px-4 sm:px-6 py-10 md:py-16 max-w-7xl mx-auto">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-l from-[#F7EFE9] via-[#E8D3C5]/35 to-[#FDFBF7] p-8 md:p-14 flex flex-col md:flex-row items-center justify-between gap-8 border border-[#EFE8E1] shadow-sm">
          <div className="max-w-xl z-10 text-center md:text-right">
            <span className="inline-block text-xs uppercase tracking-[0.18em] font-semibold text-[#B89320] bg-white/80 px-4 py-1.5 rounded-full mb-4 shadow-sm">
              ✨ اکسیر درخشش طبیعی پوست
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#2A2421] leading-tight mb-5">
              زیبایی اصیل شما با <span className="text-[#D4AF37]">LUMiR</span> می‌درخشد
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base mb-8 leading-8 font-light max-w-md mx-auto md:mx-0">
              مجموعه‌ای از محصولات آرایشی و بهداشتی اصل، با ارسال سریع و پرداخت امن — شادابی که شایسته آن هستید.
            </p>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <Link
                href="#products"
                className="px-7 py-3.5 bg-[#2A2421] text-white rounded-2xl font-medium shadow-xl hover:bg-[#D4AF37] transition-all duration-300 hover:-translate-y-0.5 glow-effect text-sm"
              >
                کشف محصولات
              </Link>
              <Link
                href="/discounts"
                className="px-7 py-3.5 bg-white/80 text-[#2A2421] border border-[#EFE8E1] rounded-2xl font-medium hover:bg-white transition-all duration-300 text-sm"
              >
                تخفیف‌های درخشان
              </Link>
            </div>
          </div>
          <div className="relative w-full md:w-1/2 h-64 sm:h-80 md:h-[400px] rounded-2xl overflow-hidden shadow-2xl border-4 border-white">
            <div className="absolute inset-0 bg-gradient-to-tr from-[#2A2421]/20 to-transparent z-10" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop"
              alt="Lumir Beauty"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-1000"
            />
          </div>
        </div>
      </section>
    );
  }

  function renderProducts() {
    return (
      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 pb-12 sm:pb-16">
        <div className="flex items-center justify-between mb-5 gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#B89320] font-semibold">مجموعه محبوب</span>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A2421] mt-0.5">
              {q ? `نتایج «${q}»` : activeCategory ? activeCategory.name : "پرفروش‌ترین‌های لومیر"}
            </h2>
          </div>
          <span className="text-xs text-neutral-400 shrink-0">{products.length} محصول</span>
        </div>

        {isFiltered && (
          <Link href="/" className="inline-block mb-4 text-sm text-rose-600 hover:underline">
            ← بازگشت به همه محصولات
          </Link>
        )}

        {products.length === 0 ? (
          <div className="text-center py-16 sm:py-20 text-neutral-400">محصولی با این مشخصات پیدا نشد.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p, idx) => (
              <ProductCard key={p.id} product={p} priority={idx < 4} />
            ))}
          </div>
        )}
      </section>
    );
  }

  // وقتی فیلتر/جستجو فعال است، تمرکز روی محصولات باشد
  if (isFiltered) {
    return (
      <div>
        <TopSearchBar />
        {renderProducts()}
      </div>
    );
  }

  return (
    <div>
      <TopSearchBar />
      {sections.map((sec) => {
        switch (sec.type) {
          case "hero":
            return <div key={sec.id}>{renderHero()}</div>;
          case "trust_badges":
            return <TrustBadges key={sec.id} items={db.settings.trustBadges} />;
          case "category_tiles":
            return <CategoryTiles key={sec.id} />;
          case "discount_carousel":
            return <DiscountCarousel key={sec.id} />;
          case "products":
            return <div key={sec.id}>{renderProducts()}</div>;
          case "testimonials":
            return (
              <Testimonials
                key={sec.id}
                items={db.settings.testimonials}
                title={sec.title || "نظر خریداران لومیر"}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
