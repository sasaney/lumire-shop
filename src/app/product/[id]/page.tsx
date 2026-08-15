import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { database } from "@/lib/db";
import AddToCartButton from "@/components/AddToCartButton";
import ProductCard from "@/components/ProductCard";
import { getBuyerStockLabel } from "@/lib/stock";

function toman(n: number) {
  return n.toLocaleString("fa-IR") + " تومان";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const db = await database.read();
  const product = db.products.find((p) => p.id === id);
  if (!product) return {};

  const description = product.description.slice(0, 160);
  return {
    title: `${product.title} | لومیر`,
    description,
    openGraph: {
      title: product.title,
      description,
      images: product.image ? [{ url: product.image }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const db = await database.read();
  const product = db.products.find((p) => p.id === id);
  if (!product || product.status !== "PUBLISHED") notFound();

  const categories = db.categories.filter((c) => product.categoryIds.includes(c.id));
  const brand = db.brands?.find((b) => b.id === product.brandId);
  const primaryCategoryId = product.categoryIds[0];
  const related = db.products
    .filter(
      (p) =>
        p.status === "PUBLISHED" &&
        p.categoryIds.includes(primaryCategoryId) &&
        p.id !== product.id
    )
    .slice(0, 4);

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(100 - (product.price / product.compareAtPrice) * 100)
      : null;

  const stockLabel = getBuyerStockLabel(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    image: product.images?.length ? product.images : product.image,
    brand: brand ? { "@type": "Brand", name: brand.nameFa } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "IRR",
      price: product.price,
      availability:
        product.stock > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(product.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: 1,
          },
        }
      : {}),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid md:grid-cols-2 gap-10">
        <div className="aspect-square rounded-3xl overflow-hidden bg-rose-50 relative">
          <Image
            src={product.image}
            alt={product.title}
            fill
            priority
            unoptimized
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          {discount && (
            <span className="price-tag absolute top-5 -right-1 bg-rose-600 text-white text-sm font-bold py-2">
              {discount}٪ تخفیف
            </span>
          )}
        </div>
        {product.images && product.images.length > 1 && (
          <div className="md:col-start-1 flex gap-2 overflow-x-auto -mt-7 relative z-10 px-2">
            {product.images.map((image, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${product.title} ${index + 1}`}
                className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow cursor-pointer bg-rose-50"
              />
            ))}
          </div>
        )}

        <div>
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/?category=${c.id}`}
                className="text-xs font-bold text-sage-600 bg-sage-50 px-3 py-1 rounded-full hover:bg-sage-100 transition"
              >
                {c.name}
              </Link>
            ))}
            {brand && (
              <span className="text-xs font-bold text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">
                {brand.nameFa}
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mt-3 leading-relaxed">
            {product.title}
          </h1>
          <div className="flex items-center gap-1 text-gold-500 mt-2 text-sm">
            {"★".repeat(Math.round(product.rating))}
            <span className="text-neutral-400">({product.rating} از ۵)</span>
          </div>

          <div className="flex items-center flex-wrap gap-3 mt-5">
            <span className="text-3xl font-extrabold text-rose-700">{toman(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-neutral-400 line-through">
                {toman(product.compareAtPrice)}
              </span>
            )}
            {discount && (
              <span className="text-xs font-extrabold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg">
                {discount}٪ تخفیف
              </span>
            )}
          </div>

          {product.descriptionHtml ? (
            <div
              className="product-description text-neutral-600 leading-8 mt-5 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
            />
          ) : (
            <p className="text-neutral-500 leading-8 mt-5 whitespace-pre-line">{product.description}</p>
          )}

          {stockLabel && (
            <div className={`mt-3 text-sm font-bold ${stockLabel === "ناموجود" ? "text-neutral-400" : "text-rose-600"}`}>
              {stockLabel}
            </div>
          )}

          <div className="mt-6">
            <AddToCartButton product={product} />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
            <div className="border border-rose-100 rounded-xl p-3">
              <div className="font-bold">پرداخت در محل</div>
              <div className="text-neutral-400 text-xs mt-1">یا کارت به کارت</div>
            </div>
            <div className="border border-rose-100 rounded-xl p-3">
              <div className="font-bold">ضمانت اصالت کالا</div>
              <div className="text-neutral-400 text-xs mt-1">۱۰۰٪ اورجینال</div>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-extrabold mb-5">محصولات مشابه</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
