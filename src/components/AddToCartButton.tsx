"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/types";

export default function AddToCartButton({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const router = useRouter();

  function handleAdd() {
    addItem(
      {
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        stock: product.stock,
      },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  if (product.stock === 0) {
    return (
      <button
        disabled
        className="w-full py-3.5 rounded-2xl bg-neutral-100 text-neutral-400 font-bold cursor-not-allowed"
      >
        ناموجود
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <div className="flex items-center border border-[#EFE8E1] rounded-2xl bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setQty((q) => Math.min(q + 1, product.stock))}
          className="w-10 h-11 text-lg hover:text-[#D4AF37] font-bold"
          aria-label="افزایش تعداد"
        >
          +
        </button>
        <span className="w-8 text-center font-bold">{qty}</span>
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="w-10 h-11 text-lg hover:text-[#D4AF37] font-bold"
          aria-label="کاهش تعداد"
        >
          −
        </button>
      </div>
      <button
        type="button"
        onClick={handleAdd}
        className={`flex-1 py-3.5 rounded-2xl font-bold transition shadow-sm ${
          added
            ? "bg-sage-600 text-white"
            : "bg-[#2A2421] text-white hover:bg-[#B89320] shadow-rose-200"
        }`}
      >
        {added ? "اضافه شد ✓" : "افزودن به سبد"}
      </button>
      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="hidden sm:block py-3.5 px-4 rounded-2xl border border-rose-200 text-[#B89320] font-bold hover:bg-[#F7EFE9] transition"
        >
          سبد
        </button>
      )}
    </div>
  );
}
