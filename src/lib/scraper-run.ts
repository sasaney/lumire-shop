import type { DB, Product, ScraperLogEntry } from "./types";
import { fetchProductInfo, applyMarkup } from "./scraper";
import { genId } from "./db";

export interface ScraperRunSummary {
  checked: number;
  updated: number;
  failed: number;
}

/**
 * روی همه محصولاتی که sourceUrl دارند اجرا می‌شود. دیتابیس ورودی را درجا تغییر می‌دهد
 * و لاگ تغییرات را به db.scraperLogs اضافه می‌کند. مسئولیت ذخیره‌ی نهایی db با فراخواننده است.
 */
export async function runScraperOnDb(db: DB): Promise<ScraperRunSummary> {
  const targets = db.products.filter((p) => p.sourceUrl && p.crawlerEnabled !== false);
  const summary: ScraperRunSummary = { checked: 0, updated: 0, failed: 0 };

  for (const product of targets) {
    summary.checked += 1;
    const result = await scrapeSingleProduct(db, product);
    if (result === "updated") summary.updated += 1;
    if (result === "failed") summary.failed += 1;
  }

  return summary;
}

/**
 * فقط یک محصول را (برای مثال هنگام تسویه‌حساب برای چک لحظه‌ای) اسکرپ و به‌روزرسانی می‌کند.
 */
export async function scrapeSingleProduct(
  db: DB,
  product: Product,
  timeoutMs?: number
): Promise<"updated" | "unchanged" | "failed" | "skipped"> {
  if (!product.sourceUrl) return "skipped";

  const info = await fetchProductInfo(product.sourceUrl, timeoutMs);
  const logId = genId("scraperlog");
  const timestamp = new Date().toISOString();

  if (!info.ok) {
    const entry: ScraperLogEntry = {
      id: logId,
      productId: product.id,
      productTitle: product.title,
      timestamp,
      changed: false,
      changes: [{ field: "خطا", oldValue: "-", newValue: info.error || "خطای نامشخص" }],
    };
    db.scraperLogs.push(entry);
    return "failed";
  }

  const priceMarkup = product.priceMarkupPercent ?? db.scraperSettings.defaultPriceMarkupPercent;
  const discountMarkup = product.discountMarkupPercent ?? db.scraperSettings.defaultDiscountMarkupPercent;

  const changes: { field: string; oldValue: string; newValue: string }[] = [];
  const idx = db.products.findIndex((p) => p.id === product.id);
  if (idx === -1) return "skipped";

  if (info.title && info.title !== db.products[idx].title) {
    changes.push({ field: "عنوان", oldValue: db.products[idx].title, newValue: info.title });
    db.products[idx].title = info.title;
  }

  if (info.description && info.description !== db.products[idx].description) {
    changes.push({ field: "توضیحات", oldValue: "قبلی", newValue: "به‌روزرسانی شد" });
    db.products[idx].description = info.description;
  }

  if (info.descriptionHtml && info.descriptionHtml !== db.products[idx].descriptionHtml) {
    changes.push({ field: "توضیحات HTML", oldValue: "قبلی", newValue: "به‌روزرسانی شد" });
    db.products[idx].descriptionHtml = info.descriptionHtml;
  }

  if (info.images && info.images.length > 0) {
    const oldImages = db.products[idx].images || (db.products[idx].image ? [db.products[idx].image] : []);
    const sameImages =
      oldImages.length === info.images.length &&
      oldImages.every((image, i) => image === info.images?.[i]);

    if (!sameImages) {
      changes.push({
        field: "گالری تصاویر",
        oldValue: `${oldImages.length} عکس`,
        newValue: `${info.images.length} عکس`,
      });
      db.products[idx].images = info.images;
      db.products[idx].image = info.images[0];
    }
  }

  if (info.price != null) {
    const newPrice = applyMarkup(info.price, priceMarkup);
    if (newPrice !== db.products[idx].price) {
      changes.push({ field: "قیمت", oldValue: String(db.products[idx].price), newValue: String(newPrice) });
      db.products[idx].price = newPrice;
    }
    if (discountMarkup > 0) {
      const newCompareAt = applyMarkup(info.price, discountMarkup);
      if (newCompareAt !== db.products[idx].compareAtPrice) {
        changes.push({
          field: "قیمت قبل از تخفیف",
          oldValue: String(db.products[idx].compareAtPrice ?? "-"),
          newValue: String(newCompareAt),
        });
        db.products[idx].compareAtPrice = newCompareAt;
      }
    }
  }

  if (info.inStock === false && db.products[idx].stock !== 0) {
    changes.push({ field: "موجودی", oldValue: String(db.products[idx].stock), newValue: "0 (ناموجود در منبع)" });
    db.products[idx].stock = 0;
  } else if (info.inStock === true && db.products[idx].stock === 0) {
    // منبع فقط «موجود است» را اعلام می‌کند، نه تعداد دقیق؛ برای جلوگیری از فروش با موجودی صفر،
    // حداقل ۱ عدد ثبت می‌شود تا ادمین موجودی دقیق را دستی تنظیم کند.
    changes.push({ field: "موجودی", oldValue: "0", newValue: "1 (موجود شد در منبع — نیاز به تایید تعداد دقیق)" });
    db.products[idx].stock = 1;
  }

  db.products[idx].lastScrapedAt = timestamp;

  const entry: ScraperLogEntry = {
    id: logId,
    productId: product.id,
    productTitle: product.title,
    timestamp,
    changed: changes.length > 0,
    changes,
  };
  db.scraperLogs.push(entry);

  // فقط ۲۰۰ لاگ آخر نگه داشته می‌شود تا حجم دیتابیس رشد بی‌رویه نکند
  if (db.scraperLogs.length > 200) {
    db.scraperLogs = db.scraperLogs.slice(-200);
  }

  return changes.length > 0 ? "updated" : "unchanged";
}
