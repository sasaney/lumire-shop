import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ categories: db.categories });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { name, slug, parentId, nameEn, icon, wcCategoryId, link, order, isActive } = await req.json();
  if (!name) return NextResponse.json({ error: "نام دسته‌بندی الزامی است." }, { status: 400 });

  const db = await database.read();
  const siblingCount = db.categories.filter((c) => (c.parentId || null) === (parentId || null)).length;
  const category = {
    id: genId("cat"),
    name,
    slug: slug || name.replace(/\s+/g, "-"),
    parentId: parentId || null,
    order: Number(order) || siblingCount + 1,
    nameEn: nameEn || "",
    icon: icon || "",
    wcCategoryId: wcCategoryId || null,
    link: link || (wcCategoryId ? `/products?category=${wcCategoryId}` : null),
    isActive: isActive !== false,
  };
  db.categories.push(category);
  await database.write(db);
  return NextResponse.json({ ok: true, category });
}
