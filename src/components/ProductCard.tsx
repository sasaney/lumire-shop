"use client";

import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/types";
import { getBuyerStockLabel } from "@/lib/stock";
import { useCart } from "@/lib/cart-context";

function toman(n: number) {
  return n.toLocaleString("fa-IR");
}

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const { addItem } = useCart();
  const hasDiscount = product.compareAtPrice != null && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(100 - (product.price / (product.compareAtPrice as number)) * 100)
    : 0;
  const outOfStock = product.stock <= 0;
  const stockLabel = getBuyerStockLabel(product) || (outOfStock ? "ناموجود" : "موجود");
  const imgSrc = product.image || "/placeholder-product.svg";

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem(
      {
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        stock: product.stock,
      },
      1
    );
  }

  return (
    <Link
      href={`/product/${product.id}`}
      className="product-card group relative bg-white rounded-2xl p-3 border border-[#EFE8E1] flex flex-col justify-between overflow-hidden"
    >
      {discountPercent > 0 && (
        <span className="absolute top-5 right-5 z-10 bg-[#2A2421] text-[#E8D3C5] text-xs font-semibold px-3 py-1 rounded-full">
          %{discountPercent.toLocaleString("fa-IR")} OFF
        </span>
      )}
      {product.badge === "BESTSELLER" && discountPercent === 0 && (
        <span className="absolute top-5 right-5 z-10 badge badge-bestseller">پرفروش</span>
      )}
      {product.badge === "NEW" && discountPercent === 0 && (
        <span className="absolute top-5 right-5 z-10 badge badge-new">جدید</span>
      )}

      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#FDFBF7] mb-3">
        <Image
          src={imgSrc}
          alt={product.title}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          unoptimized={imgSrc.startsWith("data:")}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        {!outOfStock && (
          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
            <span className="w-full py-2.5 bg-white/90 backdrop-blur-md text-[#2A2421] rounded-xl text-center text-sm font-medium shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300">
              مشاهده سریع
            </span>
          </div>
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-white/55 flex items-center justify-center">
            <span className="badge badge-outofstock">ناموجود</span>
          </div>
        )}
      </div>

      <div className="px-1 flex flex-col flex-grow justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase tracking-widest text-[#B89320] font-semibold">
            Lumir
          </span>
          <h3 className="text-sm font-semibold text-[#2A2421] mt-1 line-clamp-2 min-h-[2.5rem] group-hover:text-[#D4AF37] transition-colors leading-6">
            {product.title}
          </h3>
        </div>

        <div className="flex items-center justify-between border-t border-[#F7EFE9] pt-3">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-[11px] text-gray-400 line-through">
                {toman(product.compareAtPrice as number)} تومان
              </span>
            )}
            <span className="text-base font-bold text-[#2A2421]">
              {toman(product.price)}{" "}
              <span className="text-[10px] font-normal text-neutral-500">تومان</span>
            </span>
            <span className={`text-[10px] mt-0.5 ${outOfStock ? "text-neutral-400" : "text-[#8a7a6b]"}`}>
              {stockLabel}
            </span>
          </div>
          <button
            type="button"
            onClick={quickAdd}
            disabled={outOfStock}
            aria-label="افزودن به سبد"
            className="p-2.5 bg-[#F7EFE9] text-[#2A2421] rounded-xl hover:bg-[#D4AF37] hover:text-white transition-colors duration-300 disabled:opacity-40 disabled:pointer-events-none"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}
