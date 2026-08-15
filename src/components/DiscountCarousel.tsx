"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import ProductCard from "@/components/ProductCard";

export default function DiscountCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/products?discounted=1&limit=10")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []));
  }, []);

  function scroll(dir: 1 | -1) {
    scrollRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-extrabold flex items-center gap-2">
          <span className="text-rose-600">🔥</span> پیشنهادهای تخفیف‌دار
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href="/discounts"
            className="text-sm font-bold text-rose-600 hover:underline shrink-0"
          >
            مشاهده بیشتر
          </Link>
          <button
            onClick={() => scroll(1)}
            className="hidden sm:flex w-8 h-8 rounded-full border border-rose-100 items-center justify-center hover:bg-rose-50"
            aria-label="اسکرول به راست"
          >
            ›
          </button>
          <button
            onClick={() => scroll(-1)}
            className="hidden sm:flex w-8 h-8 rounded-full border border-rose-100 items-center justify-center hover:bg-rose-50"
            aria-label="اسکرول به چپ"
          >
            ‹
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div key={p.id} className="w-44 sm:w-56 shrink-0">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
