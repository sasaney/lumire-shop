import type { OrderStatus } from "./types";

export const statusLabels: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "در انتظار پرداخت",
  NEW: "سفارش جدید",
  PREPARING: "در حال آماده‌سازی",
  SHIPPING: "در حال ارسال",
  SHIPPED: "ارسال شده",
  CANCELLED: "لغو شده",
  RETURNED: "مرجوعی",
};

export const statusColors: Record<OrderStatus, string> = {
  AWAITING_PAYMENT: "bg-gold-400/20 text-gold-500",
  NEW: "bg-rose-50 text-rose-600",
  PREPARING: "bg-sage-50 text-sage-600",
  SHIPPING: "bg-rose-50 text-rose-600",
  SHIPPED: "bg-sage-50 text-sage-600",
  CANCELLED: "bg-neutral-100 text-neutral-500",
  RETURNED: "bg-neutral-100 text-neutral-500",
};

export const statusOrder: OrderStatus[] = [
  "AWAITING_PAYMENT",
  "NEW",
  "PREPARING",
  "SHIPPING",
  "SHIPPED",
  "CANCELLED",
  "RETURNED",
];

export function toman(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}
