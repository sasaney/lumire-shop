import { notFound } from "next/navigation";
import { database } from "@/lib/db";

export default async function CmsPageView({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = await database.read();
  const page = db.pages.find((p) => p.slug === slug && p.status === "PUBLISHED");
  if (!page) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {page.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={page.image} alt={page.title} className="w-full rounded-2xl mb-6 aspect-video object-cover" />
      )}
      <h1 className="text-2xl font-extrabold mb-6">{page.title}</h1>
      <div className="prose prose-sm max-w-none leading-8 text-neutral-700 whitespace-pre-line">
        {page.content}
      </div>
      {page.customCode && (
        <div className="mt-6" dangerouslySetInnerHTML={{ __html: page.customCode }} />
      )}
    </div>
  );
}
