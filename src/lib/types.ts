export type Role = "ADMIN" | "CUSTOMER";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash?: string;
  role: Role;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  order?: number;
  nameEn?: string;
  icon?: string;
  wcCategoryId?: string | null;
  link?: string | null;
  isActive?: boolean;
  showInMenu?: boolean;
  showInMegaMenu?: boolean;
}

export interface Brand {
  id: string;
  nameFa: string;
  nameEn?: string;
  logo?: string;
}

export type ProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export interface ProductAttribute {
  name: string;
  value: string;
}

export interface ProductAttributeGroup {
  name: string;
  items: ProductAttribute[];
}

export interface Product {
  id: string;
  code?: string | null;
  sku?: string | null;
  title: string;
  titleEn?: string | null;
  categoryIds: string[];
  brandId?: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  displayStockOverride?: number | null;
  status: ProductStatus;
  image: string;
  images?: string[];
  video?: string | null;
  color?: string | null;
  colors?: string[];
  weightGrams?: number | null;
  lengthCm?: number | null;
  widthCm?: number | null;
  heightCm?: number | null;
  warranties?: string[];
  attributes?: ProductAttributeGroup[];
  commissionPercent?: number | null;
  sourceType?: string | null;
  description: string;
  descriptionHtml?: string | null;
  rating: number;
  badge?: "NEW" | "BESTSELLER" | null;
  sourceUrl?: string | null;
  crawlerEnabled?: boolean;
  priceMarkupPercent?: number | null;
  discountMarkupPercent?: number | null;
  lastScrapedAt?: string | null;
  /** روش‌های ارسال مجاز برای این محصول — اگر خالی/undefined باشد همه روش‌های فعال اعمال می‌شود */
  shippingMethodIds?: string[] | null;
  createdAt: string;
}

export type OrderStatus =
  | "AWAITING_PAYMENT"
  | "NEW"
  | "PREPARING"
  | "SHIPPING"
  | "SHIPPED"
  | "CANCELLED"
  | "RETURNED";

export type PaymentMethod = "COD" | "CARD_TO_CARD";

/** پیش‌کرایه = هزینه ارسال موقع سفارش | پس‌کرایه = هزینه در محل/هنگام تحویل */
export type FreightType = "PREPAID" | "COLLECT";

export interface ShippingMethod {
  id: string;
  name: string;
  description?: string;
  /** هزینه پایه (تومان) — برای پس‌کرایه معمولاً ۰ و توضیح در description */
  cost: number;
  freightType: FreightType;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  active: boolean;
  order: number;
}

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  shippingCost?: number;
  shippingMethodId?: string | null;
  shippingMethodName?: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  address: string;
  phone: string;
  receiverName: string;
  note?: string;
  receiptImage?: string | null;
  trackingCode?: string | null;
  shippingProvider?: string | null;
  createdAt: string;
}

export interface OtpEntry {
  email: string;
  code: string;
  expiresAt: string;
}

export interface MenuItem {
  id: string;
  label: string;
  link: string;
  parentId?: string | null;
  order: number;
  nameEn?: string;
  icon?: string;
  wcCategoryId?: string | null;
  isActive?: boolean;
}

export interface CmsPage {
  id: string;
  code?: string | null;
  sku?: string | null;
  title: string;
  slug: string;
  content: string;
  customCode?: string | null;
  image?: string | null;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
}

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  active: boolean;
  priority: number;
}

export interface FooterLink {
  id: string;
  label: string;
  href: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterSocial {
  id: string;
  label: string;
  href: string;
}

export interface FooterSettings {
  brandName: string;
  aboutText: string;
  columns: FooterColumn[];
  contactTitle: string;
  contactText: string;
  phone?: string;
  email?: string;
  socials: FooterSocial[];
  copyright: string;
}

export type LandingSectionType =
  | "hero"
  | "trust_badges"
  | "category_tiles"
  | "discount_carousel"
  | "products"
  | "testimonials";

export interface LandingSection {
  id: string;
  type: LandingSectionType;
  title?: string;
  active: boolean;
  order: number;
}

export interface TrustBadgeItem {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  text: string;
  product?: string;
}

export interface SiteSettings {
  headerText?: string;
  /** @deprecated استفاده از footer */
  footerText?: string;
  footer: FooterSettings;
  slides: HeroSlide[];
  landingSections: LandingSection[];
  trustBadges: TrustBadgeItem[];
  testimonials: TestimonialItem[];
}

export interface ScraperLogEntry {
  id: string;
  productId: string;
  productTitle: string;
  timestamp: string;
  changed: boolean;
  changes: { field: string; oldValue: string; newValue: string }[];
}

export interface ScraperSource {
  id: string;
  name: string;
  baseUrl?: string;
  active: boolean;
}

export interface ScraperSettings {
  enabled: boolean;
  defaultPriceMarkupPercent: number;
  defaultDiscountMarkupPercent: number;
  intervalMinutes: number;
  liveCheckOnCheckout: boolean;
  sources: ScraperSource[];
}

export interface DB {
  users: User[];
  otps: OtpEntry[];
  categories: Category[];
  brands: Brand[];
  products: Product[];
  orders: Order[];
  menu: MenuItem[];
  pages: CmsPage[];
  settings: SiteSettings;
  scraperLogs: ScraperLogEntry[];
  pageViews: Record<string, number>;
  scraperSettings: ScraperSettings;
  shippingMethods: ShippingMethod[];
}

export function defaultFooter(): FooterSettings {
  return {
    brandName: "لومیر",
    aboutText: "مرجع خرید آنلاین محصولات آرایشی و بهداشتی، با ضمانت اصالت کالا.",
    columns: [
      {
        id: "col-support",
        title: "پشتیبانی",
        links: [
          { id: "l1", label: "سوالات متداول", href: "/pages/faq" },
          { id: "l2", label: "راهنمای خرید", href: "/pages/guide" },
          { id: "l3", label: "شرایط بازگشت کالا", href: "/pages/returns" },
        ],
      },
    ],
    contactTitle: "تماس با ما",
    contactText: "پشتیبانی از ساعت ۹ تا ۲۱ همه‌روزه",
    phone: "",
    email: "",
    socials: [],
    copyright: `© ${new Date().getFullYear()} لومیر — تمامی حقوق محفوظ است.`,
  };
}

export function defaultLandingSections(): LandingSection[] {
  return [
    { id: "sec-hero", type: "hero", title: "اسلایدر / هیرو", active: true, order: 1 },
    { id: "sec-trust", type: "trust_badges", title: "اعتماد و ضمانت", active: true, order: 2 },
    { id: "sec-cats", type: "category_tiles", title: "دسته‌بندی‌ها", active: true, order: 3 },
    { id: "sec-disc", type: "discount_carousel", title: "تخفیف‌های ویژه", active: true, order: 4 },
    { id: "sec-products", type: "products", title: "محصولات", active: true, order: 5 },
    { id: "sec-testimonials", type: "testimonials", title: "نظرات مشتریان", active: true, order: 6 },
  ];
}

export function defaultTrustBadges(): TrustBadgeItem[] {
  return [
    { id: "tb1", icon: "✅", title: "ضمانت اصالت کالا", desc: "همه محصولات ۱۰۰٪ اورجینال" },
    { id: "tb2", icon: "🚚", title: "ارسال سریع", desc: "۲ تا ۴ روز کاری به سراسر کشور" },
    { id: "tb3", icon: "💳", title: "پرداخت در محل", desc: "یا کارت به کارت، بدون درگاه" },
  ];
}

export function defaultTestimonials(): TestimonialItem[] {
  return [
    {
      id: "t1",
      name: "نگار.ک",
      text: "کیفیت کرم مرطوب‌کننده واقعاً عالی بود و بسته‌بندی هم شیک و مرتب رسید.",
      product: "کرم مرطوب‌کننده روزانه",
    },
    {
      id: "t2",
      name: "سارا.م",
      text: "ارسال خیلی سریع بود و پرداخت در محل خیالم رو راحت کرد. حتماً دوباره خرید می‌کنم.",
      product: "رژ لب مات",
    },
    {
      id: "t3",
      name: "الهام.ر",
      text: "محصولات کاملاً اورجینال هستن، رنگ و رایحه دقیقاً همونی بود که توی عکس دیدم.",
      product: "عطر جیبی زنانه",
    },
  ];
}

export function defaultShippingMethods(): ShippingMethod[] {
  return [
    {
      id: "ship-post",
      name: "پست پیشتاز",
      description: "ارسال از طریق پست پیشتاز به سراسر کشور",
      cost: 45000,
      freightType: "PREPAID",
      estimatedDaysMin: 2,
      estimatedDaysMax: 4,
      active: true,
      order: 1,
    },
    {
      id: "ship-tipax",
      name: "تیپاکس",
      description: "ارسال سریع تیپاکس",
      cost: 75000,
      freightType: "PREPAID",
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      active: true,
      order: 2,
    },
    {
      id: "ship-cod-freight",
      name: "پس‌کرایه (پرداخت هزینه در محل)",
      description: "هزینه ارسال هنگام تحویل محاسبه و دریافت می‌شود",
      cost: 0,
      freightType: "COLLECT",
      estimatedDaysMin: 2,
      estimatedDaysMax: 5,
      active: true,
      order: 3,
    },
  ];
}
