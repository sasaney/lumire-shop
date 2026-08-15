import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";
import { validate, otpVerifySchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit(`otp-verify:${ip}`, 10, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "تعداد تلاش‌های تایید کد بیش از حد مجاز است." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const result = validate(otpVerifySchema, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { email, code } = result.data;

  const db = await database.read();
  const otp = db.otps.find((o) => o.email === email);

  if (!otp || otp.code !== code) {
    return NextResponse.json({ error: "کد وارد شده صحیح نیست." }, { status: 401 });
  }
  if (new Date(otp.expiresAt).getTime() < Date.now()) {
    return NextResponse.json({ error: "کد منقضی شده است. دوباره تلاش کنید." }, { status: 401 });
  }

  const user = db.users.find((u) => u.email === email);
  if (!user) {
    return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
  }

  db.otps = db.otps.filter((o) => o.email !== email);
  await database.write(db);

  await setSessionCookie({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });

  return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
}
