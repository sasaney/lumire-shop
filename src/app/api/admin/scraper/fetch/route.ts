import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { fetchProductInfo, applyMarkup } from "@/lib/scraper";
import { database } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { url, priceMarkupPercent, discountMarkupPercent } = await req.json();
  if (!url || typeof url !== "string") {
    return NextResponse.json({ error: "آدرس URL را وارد کنید." }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return NextResponse.json({ error: "آدرس URL معتبر نیست." }, { status: 400 });
  }

  const info = await fetchProductInfo(parsed.toString());
  if (!info.ok) {
    return NextResponse.json({ error: info.error || "دریافت اطلاعات ناموفق بود." }, { status: 422 });
  }

  const db = await database.read();
  const priceMarkup = priceMarkupPercent ?? db.scraperSettings.defaultPriceMarkupPercent;
  const discountMarkup = discountMarkupPercent ?? db.scraperSettings.defaultDiscountMarkupPercent;

  return NextResponse.json({
    ok: true,
    raw: info,
    // قیمت نهایی پیشنهادی بعد از اعمال مارک‌آپ — ادمین می‌تواند قبل از ذخیره ویرایش کند
    suggested: {
      title: info.title || "",
      description: info.description || "",
      descriptionHtml: info.descriptionHtml || null,
      image: info.image || "",
      images: info.images || (info.image ? [info.image] : []),
      price: info.price != null ? applyMarkup(info.price, priceMarkup) : null,
      compareAtPrice:
        info.price != null && discountMarkup > 0
          ? applyMarkup(info.price, discountMarkup)
          : null,
      inStock: info.inStock,
    },
  });
}
