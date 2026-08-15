import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";
import { validate, registerSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تعداد درخواست‌های ثبت‌نام بیش از حد مجاز است. بعداً دوباره امتحان کنید." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = validate(registerSchema, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { name, email, phone, password } = result.data;

  const db = await database.read();
  const exists = db.users.find((u) => u.email.toLowerCase() === email);
  if (exists) {
    return NextResponse.json(
      { error: "کاربری با این ایمیل قبلاً ثبت‌نام کرده است." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = {
    id: genId("user"),
    name,
    email,
    phone: phone || "",
    passwordHash,
    role: "CUSTOMER" as const,
    createdAt: new Date().toISOString(),
  };
  db.users.push(user);
  await database.write(db);

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
