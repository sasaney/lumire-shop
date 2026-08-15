import type { Product } from "./types";

/**
 * موجودی واقعی فقط برای ادمین نمایش داده می‌شود.
 * برای خریدار: اگر موجودی مؤثر (override ادمین یا موجودی واقعی) دقیقاً ۱ باشد
 * پیام «فقط ۱ عدد باقی مانده» نمایش داده می‌شود، در غیر این صورت فقط
 * وضعیت «موجود» یا «ناموجود» نشان داده می‌شود، بدون عدد دقیق.
 */
export function getBuyerStockLabel(product: Product): string | null {
  const effective = product.displayStockOverride ?? product.stock;
  if (product.stock === 0) return "ناموجود";
  if (effective === 1) return "فقط ۱ عدد در انبار باقی مانده!";
  return null; // چیزی نمایش داده نمی‌شود؛ فقط دکمه خرید فعال است
}

export function isOutOfStock(product: Product) {
  return product.stock === 0;
}
