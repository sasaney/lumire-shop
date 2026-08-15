import type { TestimonialItem } from "@/lib/types";
import { defaultTestimonials } from "@/lib/types";

export default function Testimonials({
  items,
  title = "نظر خریداران لومیر",
  subtitle = "تجربه واقعی مشتریانی که از لومیر خرید کرده‌اند",
}: {
  items?: TestimonialItem[];
  title?: string;
  subtitle?: string;
}) {
  const list = items && items.length > 0 ? items : defaultTestimonials();
  return (
    <section className="max-w-6xl mx-auto px-4 py-10 sm:py-12">
      <h2 className="text-xl font-extrabold mb-1">{title}</h2>
      <p className="text-sm text-neutral-400 mb-6">{subtitle}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((t) => (
          <div
            key={t.id}
            className="bg-white border border-[#EFE8E1] rounded-2xl p-5 shadow-sm"
          >
            <div className="font-bold text-sm mb-2">{t.name}</div>
            <p className="text-sm text-neutral-600 leading-7">{t.text}</p>
            {t.product && (
              <div className="mt-3 text-xs text-[#D4AF37] font-bold">{t.product}</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
