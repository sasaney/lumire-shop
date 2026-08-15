import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { getSession } from "@/lib/auth";
import type { Role } from "@/lib/types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const role = body.role as Role;
  if (role !== "ADMIN" && role !== "CUSTOMER") {
    return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });
  }

  const db = await database.read();
  const idx = db.users.findIndex((u) => u.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  // جلوگیری از حذف آخرین ادمین
  if (db.users[idx].role === "ADMIN" && role === "CUSTOMER") {
    const adminCount = db.users.filter((u) => u.role === "ADMIN").length;
    if (adminCount <= 1) {
      return NextResponse.json(
        { error: "حداقل یک مدیر باید در سیستم باقی بماند." },
        { status: 400 }
      );
    }
  }

  db.users[idx].role = role;
  await database.write(db);

  return NextResponse.json({
    ok: true,
    user: {
      id: db.users[idx].id,
      name: db.users[idx].name,
      email: db.users[idx].email,
      role: db.users[idx].role,
    },
  });
}
