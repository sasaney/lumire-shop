import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";
import { validate, loginSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  // حداکثر ۱۰ تلاش ورود در هر ۱۵ دقیقه به‌ازای هر IP (جلوگیری از brute-force)
  const rl = rateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تعداد تلاش‌های ورود بیش از حد مجاز است. چند دقیقه بعد دوباره امتحان کنید." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = validate(loginSchema, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { email, password } = result.data;

  const db = await database.read();
  const user = db.users.find((u) => u.email.toLowerCase() === email);

  if (!user || !user.passwordHash) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "ایمیل یا رمز عبور اشتباه است." }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
