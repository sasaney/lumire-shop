import * as cheerio from "cheerio";

export interface ScrapedProductInfo {
  ok: boolean;
  error?: string;
  title?: string;
  price?: number | null;
  currency?: string | null;
  inStock?: boolean | null;
  image?: string | null;
  images?: string[];
  description?: string | null;
  descriptionHtml?: string | null;
}

/**
 * اسکرپر عمومی و مقاوم برای فروشگاه‌های WooCommerce/WordPress و صفحات Product عمومی.
 *
 * ترتیب استخراج:
 *  1) JSON-LD Product / Offer
 *  2) OpenGraph
 *  3) سلکتورهای استاندارد WooCommerce
 *  4) fallback عمومی DOM
 *
 * علاوه بر عکس اصلی، گالری محصول و عکس‌های داخل توضیحات نیز استخراج می‌شوند.
 */
export async function fetchProductInfo(
  url: string,
  timeoutMs = 15000
): Promise<ScrapedProductInfo> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const controller = new AbortController();
    timer = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/151.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "fa-IR,fa;q=0.9,en-US;q=0.7,en;q=0.6",
        "Cache-Control": "no-cache",
      },
    });

    if (!res.ok) {
      return { ok: false, error: `سرور مقصد پاسخ ${res.status} داد.` };
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      return { ok: false, error: "آدرس واردشده صفحه HTML محصول نیست." };
    }

    const html = await res.text();
    return parseProductHtml(html, url);
  } catch (err) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "دریافت اطلاعات از سایت مقصد بیش از حد طول کشید."
        : err instanceof Error
          ? `امکان اتصال به آدرس داده‌شده وجود نداشت: ${err.message}`
          : "امکان اتصال به آدرس داده‌شده وجود نداشت.";
    return { ok: false, error: message };
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function parseProductHtml(html: string, baseUrl = "https://example.com/"): ScrapedProductInfo {
  const $ = cheerio.load(html);
  const result: ScrapedProductInfo = {
    ok: true,
    images: [],
  };

  const imageSet = new Set<string>();
  const addImage = (value: unknown) => {
    if (typeof value !== "string") return;
    const url = resolveUrl(value, baseUrl);
    if (!url || !/^https?:\/\//i.test(url)) return;
    if (/\.svg(?:[?#]|$)/i.test(url)) return;
    imageSet.add(url);
  };

  // ---------- JSON-LD ----------
  const ldJsonBlocks = $('script[type="application/ld+json"]')
    .map((_, el) => $(el).text())
    .get();

  for (const raw of ldJsonBlocks) {
    const product = extractProductFromJsonLd(raw, baseUrl);
    if (!product) continue;

    result.title ??= product.title;
    if (result.price == null) result.price = product.price;
    result.currency ??= product.currency;
    if (result.inStock == null) result.inStock = product.inStock;
    result.description ??= product.description;
    result.descriptionHtml ??= product.descriptionHtml;

    for (const image of product.images || []) addImage(image);
    if (product.image) addImage(product.image);
  }

  // ---------- OpenGraph / standard meta ----------
  result.title ??=
    cleanText($('meta[property="og:title"]').attr("content")) ||
    cleanText($('meta[name="twitter:title"]').attr("content")) ||
    cleanText($("h1.product_title").first().text()) ||
    cleanText($("h1").first().text()) ||
    cleanText($("title").first().text()) ||
    undefined;

  const metaDescription =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    $('meta[name="twitter:description"]').attr("content");

  result.description ??= cleanText(metaDescription) || undefined;

  addImage($('meta[property="og:image"]').attr("content"));
  addImage($('meta[property="og:image:url"]').attr("content"));
  addImage($('meta[name="twitter:image"]').attr("content"));
  addImage($('link[rel="image_src"]').attr("href"));

  // ---------- WooCommerce product gallery ----------
  const gallerySelectors = [
    ".woocommerce-product-gallery img",
    ".woocommerce-product-gallery__image img",
    ".product-gallery img",
    ".product-images img",
    ".product-image img",
    ".flex-control-thumbs img",
    ".woocommerce div.product div.images img",
  ];

  for (const selector of gallerySelectors) {
    $(selector).each((_, el) => {
      const $img = $(el);
      addImage(
        $img.attr("data-large_image") ||
          $img.attr("data-large-image") ||
          $img.attr("data-src") ||
          $img.attr("data-lazy-src") ||
          $img.attr("src")
      );

      const srcset = $img.attr("data-srcset") || $img.attr("srcset");
      for (const candidate of parseSrcset(srcset)) addImage(candidate);
    });
  }

  // WooCommerce often keeps the high-resolution image URL on the anchor.
  $(".woocommerce-product-gallery a, .product-gallery a, .product-images a").each((_, el) => {
    addImage($(el).attr("data-large_image"));
    addImage($(el).attr("href"));
  });

  // ---------- Description / content ----------
  const descriptionHtml = extractDescriptionHtml($, baseUrl);
  if (descriptionHtml) {
    result.descriptionHtml = descriptionHtml;
    const descriptionText = cleanText(cheerio.load(descriptionHtml).text());
    if (descriptionText) result.description = descriptionText;
  }

  // Images embedded in the description are part of the product gallery too.
  if (descriptionHtml) {
    const $desc = cheerio.load(descriptionHtml);
    $desc("img").each((_, el) => {
      addImage(
        $desc(el).attr("data-large_image") ||
          $desc(el).attr("data-src") ||
          $desc(el).attr("src")
      );
    });
  }

  // ---------- Price ----------
  if (result.price == null) {
    const priceCandidates = [
      $(".summary .price .amount").first().text(),
      $(".product .price .amount").first().text(),
      $(".price .woocommerce-Price-amount").first().text(),
      '[itemprop="price"]',
      ".product-price",
      ".price",
    ];

    for (const selector of priceCandidates) {
      const raw =
        selector.startsWith("[") ? $(selector).first().attr("content") : $(selector).first().text();
      const price = parseIranianPrice(raw);
      if (price != null) {
        result.price = price;
        break;
      }
    }
  }

  result.currency ??=
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content") ||
    $('[itemprop="priceCurrency"]').first().attr("content") ||
    undefined;

  if (result.price == null) {
    const ogPrice =
      $('meta[property="product:price:amount"]').attr("content") ||
      $('meta[property="og:price:amount"]').attr("content") ||
      $('[itemprop="price"]').first().attr("content");
    result.price = parseIranianPrice(ogPrice);
  }

  // ---------- Availability ----------
  if (result.inStock == null) {
    const availability =
      $('meta[property="product:availability"]').attr("content") ||
      $('[itemprop="availability"]').first().attr("href") ||
      $('[itemprop="availability"]').first().attr("content") ||
      "";

    if (availability) {
      result.inStock = /instock|in[\s_-]?stock|available|موجود/i.test(availability)
        ? true
        : /outofstock|out[\s_-]?of[\s_-]?stock|unavailable|ناموجود|اتمام/i.test(availability)
          ? false
          : null;
    }
  }

  if (result.inStock == null) {
    const stockText = cleanText(
      $(".stock").first().text() ||
        $(".availability").first().text() ||
        $(".product-stock").first().text()
    );
    if (stockText) {
      if (/ناموجود|اتمام موجودی|out of stock|unavailable/i.test(stockText)) result.inStock = false;
      else if (/موجود|in stock|available/i.test(stockText)) result.inStock = true;
    }
  }

  result.images = Array.from(imageSet).slice(0, 20);
  result.image = result.images[0] || null;

  if (!result.title && result.price == null && !result.image && !result.description) {
    return {
      ok: false,
      error:
        "هیچ اطلاعات قابل‌اعتمادی از صفحه پیدا نشد. ساختار صفحه با WooCommerce/Schema/OpenGraph همخوانی ندارد.",
    };
  }

  return result;
}

function extractDescriptionHtml($: cheerio.CheerioAPI, baseUrl: string): string | null {
  const selectors = [
    ".woocommerce-Tabs-panel--description",
    "#tab-description",
    ".woocommerce-product-details__short-description",
    ".product-description",
    ".product-details-description",
    ".product-content",
    ".entry-content",
    "article .entry-content",
  ];

  let best = "";
  let bestScore = 0;

  for (const selector of selectors) {
    $(selector).each((_, el) => {
      const $node = $(el).clone();
      sanitizeHtml($node, $, baseUrl);
      const html = $.html($node).trim();
      const textLength = cleanText($node.text()).length;
      const imageCount = $node.find("img").length;
      const score = textLength + imageCount * 250;

      if (score > bestScore && html.length > 30) {
        best = html;
        bestScore = score;
      }
    });
  }

  return best || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeHtml(
  $root: cheerio.Cheerio<any>,
  $: cheerio.CheerioAPI,
  baseUrl: string
) {
  $root.find("script,style,noscript,iframe,object,embed,form,button,input,select,textarea,nav,header,footer").remove();

  $root.find("*").each((_, el) => {
    const attrs = Object.keys(el.attribs || {});
    for (const attr of attrs) {
      const lower = attr.toLowerCase();
      const value = el.attribs?.[attr] || "";

      if (lower.startsWith("on") || lower === "style" || lower === "id" || lower === "class") {
        $(el).removeAttr(attr);
        continue;
      }

      if (lower === "src" || lower === "href" || lower === "data-src" || lower === "data-large_image") {
        if (/^\s*javascript:/i.test(value)) {
          $(el).removeAttr(attr);
        } else if (lower !== "href" || /^https?:/i.test(resolveUrl(value, baseUrl))) {
          $(el).attr(attr, resolveUrl(value, baseUrl));
        }
      }

      if (lower === "srcset" || lower === "data-srcset") {
        const values = parseSrcset(value).map((u) => resolveUrl(u, baseUrl)).join(", ");
        $(el).attr("srcset", values);
        if (lower === "data-srcset") $(el).removeAttr("data-srcset");
      }

      if (lower.startsWith("data-") && !["data-src", "data-large_image"].includes(lower)) {
        $(el).removeAttr(attr);
      }
    }
  });
}

function extractProductFromJsonLd(raw: string, baseUrl: string): ScrapedProductInfo | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    // بعضی سایت‌ها چند JSON پشت‌سرهم یا JSON خراب دارند؛ فقط همین بلوک را رد می‌کنیم.
    return null;
  }

  const candidates: Record<string, unknown>[] = [];

  const walk = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== "object") return;

    const obj = value as Record<string, unknown>;
    const type = obj["@type"];
    if (
      type === "Product" ||
      (Array.isArray(type) && type.some((t) => String(t).toLowerCase() === "product"))
    ) {
      candidates.push(obj);
    }

    if (obj["@graph"]) walk(obj["@graph"]);
    if (obj.mainEntity) walk(obj.mainEntity);
    if (obj.mainEntityOfPage) walk(obj.mainEntityOfPage);
  };

  walk(json);

  for (const node of candidates) {
    const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
    const offerObj =
      offers && typeof offers === "object" ? (offers as Record<string, unknown>) : {};

    const priceRaw = offerObj.price ?? offerObj.lowPrice ?? node.price;
    const price = parseIranianPrice(priceRaw);

    const availabilityRaw = String(offerObj.availability || "");
    const inStock = availabilityRaw
      ? /instock|in[\s_-]?stock/i.test(availabilityRaw)
        ? true
        : /outofstock|out[\s_-]?of[\s_-]?stock/i.test(availabilityRaw)
          ? false
          : null
      : null;

    const images: string[] = [];
    const pushImageValue = (value: unknown) => {
      if (typeof value === "string") images.push(resolveUrl(value, baseUrl));
      else if (Array.isArray(value)) value.forEach(pushImageValue);
      else if (value && typeof value === "object") {
        const obj = value as Record<string, unknown>;
        pushImageValue(obj.url);
        pushImageValue(obj.contentUrl);
      }
    };
    pushImageValue(node.image);

    const description =
      typeof node.description === "string" ? cleanText(node.description) : undefined;

    return {
      ok: true,
      title: typeof node.name === "string" ? cleanText(node.name) : undefined,
      price,
      currency: typeof offerObj.priceCurrency === "string" ? offerObj.priceCurrency : undefined,
      inStock,
      image: images[0] || null,
      images,
      description,
      descriptionHtml: undefined,
    };
  }

  return null;
}

function parseSrcset(srcset?: string): string[] {
  if (!srcset) return [];
  return srcset
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter(Boolean);
}

function resolveUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function cleanText(value?: string | null): string {
  return String(value || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseIranianPrice(value: unknown): number | null {
  if (value == null) return null;

  const normalized = String(value)
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[٬,،\s]/g, "")
    .replace(/[^\d.]/g, "");

  if (!normalized) return null;
  const n = Number(normalized);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

export function applyMarkup(basePrice: number, markupPercent: number): number {
  const marked = basePrice * (1 + markupPercent / 100);
  return Math.round(marked / 100) * 100;
}
