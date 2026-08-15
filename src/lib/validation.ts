import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "نام باید حداقل ۲ کاراکتر باشد.").max(100),
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  password: z.string().min(6, "رمز عبور باید حداقل ۶ کاراکتر باشد.").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  password: z.string().min(1, "رمز عبور را وارد کنید."),
});

export const otpRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  name: z.string().trim().max(100).optional(),
});

export const otpVerifySchema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست."),
  code: z.string().trim().length(5, "کد باید ۵ رقم باشد."),
});

export const orderCreateSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1, "سبد خرید نمی‌تواند خالی باشد."),
  address: z.string().trim().min(5, "آدرس معتبر نیست.").max(1000),
  phone: z.string().trim().min(8, "شماره تماس معتبر نیست.").max(20),
  receiverName: z.string().trim().min(2, "نام گیرنده معتبر نیست.").max(100),
  paymentMethod: z.enum(["COD", "CARD_TO_CARD"]),
  note: z.string().trim().max(500).optional(),
  shippingMethodId: z.string().min(1, "روش ارسال را انتخاب کنید."),
});

export const productCreateSchema = z.object({
  code: z.string().trim().max(100).optional(),
  title: z.string().trim().min(2, "عنوان محصول الزامی است.").max(200),
  titleEn: z.string().trim().max(200).nullable().optional(),
  sku: z.string().trim().max(100).nullable().optional(),
  categoryIds: z.array(z.string()).default([]),
  brandId: z.string().nullable().optional(),
  price: z.union([z.string(), z.number()]).refine((v) => Number(v) > 0, "قیمت باید بزرگ‌تر از صفر باشد."),
  compareAtPrice: z.union([z.string(), z.number(), z.null()]).optional(),
  stock: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 0, "موجودی نمی‌تواند منفی باشد."),
  displayStockOverride: z.union([z.string(), z.number(), z.null()]).optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  badge: z.enum(["NEW", "BESTSELLER"]).nullable().optional(),
  image: z.string().optional(),
  images: z.array(z.string()).optional(),
  video: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  colors: z.array(z.string()).optional(),
  weightGrams: z.number().nullable().optional(),
  lengthCm: z.number().nullable().optional(),
  widthCm: z.number().nullable().optional(),
  heightCm: z.number().nullable().optional(),
  warranties: z.array(z.string()).optional(),
  attributes: z.array(z.object({ name: z.string(), items: z.array(z.object({ name: z.string(), value: z.string() })) })).optional(),
  commissionPercent: z.number().nullable().optional(),
  sourceType: z.string().nullable().optional(),
  description: z.string().max(10000).optional(),
  descriptionHtml: z.string().max(30000).nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  crawlerEnabled: z.boolean().optional(),
  priceMarkupPercent: z.number().nullable().optional(),
  discountMarkupPercent: z.number().nullable().optional(),
  shippingMethodIds: z.array(z.string()).nullable().optional(),
});

/**
 * اجرای اعتبارسنجی و بازگرداندن پیام خطای فارسیِ اولین مشکل، برای پاسخ یکنواخت API.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (!result.success) {
    const first = result.error.issues[0];
    return { ok: false, error: first?.message || "اطلاعات ارسالی معتبر نیست." };
  }
  return { ok: true, data: result.data };
}
