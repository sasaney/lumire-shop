import type { MetadataRoute } from "next";
import { database } from "@/lib/db";

// در دیپلوی واقعی این را با دامنه اصلی سایت جایگزین کنید
const BASE_URL = "https://example.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await database.read();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/discounts`, changeFrequency: "daily", priority: 0.8 },
  ];

  const productRoutes: MetadataRoute.Sitemap = db.products
    .filter((p) => p.status === "PUBLISHED")
    .map((p) => ({
      url: `${BASE_URL}/product/${p.id}`,
      lastModified: p.createdAt,
      changeFrequency: "weekly",
      priority: 0.7,
    }));

  const pageRoutes: MetadataRoute.Sitemap = db.pages
    .filter((p) => p.status === "PUBLISHED")
    .map((p) => ({
      url: `${BASE_URL}/pages/${p.slug}`,
      lastModified: p.createdAt,
      changeFrequency: "monthly",
      priority: 0.5,
    }));

  return [...staticRoutes, ...productRoutes, ...pageRoutes];
}
