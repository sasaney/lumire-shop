import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ pages: db.pages });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const body = await req.json();
  if (!body.title || !body.slug) {
    return NextResponse.json({ error: "عنوان و آدرس صفحه (slug) الزامی است." }, { status: 400 });
  }
  const db = await database.read();
  if (db.pages.some((p) => p.slug === body.slug)) {
    return NextResponse.json({ error: "این آدرس (slug) قبلاً استفاده شده." }, { status: 409 });
  }
  const page = {
    id: genId("page"),
    title: body.title,
    slug: body.slug,
    content: body.content || "",
    customCode: body.customCode || null,
    image: body.image || null,
    status: body.status || "DRAFT",
    createdAt: new Date().toISOString(),
  };
  db.pages.push(page);
  await database.write(db);
  return NextResponse.json({ ok: true, page });
}
