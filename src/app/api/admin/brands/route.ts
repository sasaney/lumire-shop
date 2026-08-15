import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const db = await database.read();
  return NextResponse.json({ brands: db.brands });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const { nameFa, nameEn, logo } = await req.json();
  if (!nameFa) return NextResponse.json({ error: "نام فارسی برند الزامی است." }, { status: 400 });

  const db = await database.read();
  const brand = { id: genId("brand"), nameFa, nameEn: nameEn || "", logo: logo || "" };
  db.brands.push(brand);
  await database.write(db);
  return NextResponse.json({ ok: true, brand });
}
