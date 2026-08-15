"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/lib/types";

export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const slide = slides[index];

  return (
    <section className="relative border-b border-rose-100 bg-white overflow-hidden">
      <div className="relative aspect-[16/7] sm:aspect-[16/6]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/50 via-black/10 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <div className="max-w-md text-white">
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-relaxed">{slide.title}</h1>
              {slide.subtitle && <p className="mt-2 text-sm sm:text-base text-white/90">{slide.subtitle}</p>}
              {slide.link && (
                <Link
                  href={slide.link}
                  className="inline-block mt-5 px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 transition font-bold text-sm"
                >
                  مشاهده محصولات
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              className={`w-2 h-2 rounded-full transition ${i === index ? "bg-white w-6" : "bg-white/50"}`}
              aria-label={`اسلاید ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
