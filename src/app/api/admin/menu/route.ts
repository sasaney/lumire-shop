import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ menu: db.menu });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  const { label, link, parentId, nameEn, icon, wcCategoryId, order, isActive } = await req.json();
  if (!label) return NextResponse.json({ error: "عنوان الزامی است." }, { status: 400 });
  const db = await database.read();
  const siblingCount = db.menu.filter((m) => (m.parentId || null) === (parentId || null)).length;
  const item = {
    id: genId("menu"), label, nameEn: nameEn || "", icon: icon || "",
    wcCategoryId: wcCategoryId || null,
    link: link || (wcCategoryId ? `/products?category=${wcCategoryId}` : "#"),
    parentId: parentId || null, order: Number(order) || siblingCount + 1,
    isActive: isActive !== false,
  };
  db.menu.push(item);
  await database.write(db);
  return NextResponse.json({ ok: true, item });
}
