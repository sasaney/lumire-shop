import { NextRequest, NextResponse } from "next/server";
import { database, genId } from "@/lib/db";
import { sendOtpEmail } from "@/lib/mailer";
import { validate, otpRequestSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function makeCode() {
  return String(Math.floor(10000 + Math.random() * 90000)); // کد ۵ رقمی
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const body = await req.json().catch(() => null);
  const result = validate(otpRequestSchema, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  const { email, name } = result.data;

  const rl = rateLimit(`otp-request:${ip}`, 5, 10 * 60 * 1000);
  const rlEmail = rateLimit(`otp-email:${email}`, 5, 10 * 60 * 1000);
  if (!rl.allowed || !rlEmail.allowed) {
    return NextResponse.json(
      { error: "تعداد درخواست کد بیش از حد مجاز است. کمی بعد دوباره امتحان کنید." },
      { status: 429 }
    );
  }

  const db = await database.read();

  let user = db.users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    user = {
      id: genId("user"),
      name: name || email.split("@")[0],
      email,
      phone: "",
      role: "CUSTOMER",
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
  }

  const code = makeCode();
  db.otps = db.otps.filter((o) => o.email !== email);
  db.otps.push({
    email,
    code,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  });
  await database.write(db);

  const result2 = await sendOtpEmail(email, code);

  return NextResponse.json({
    ok: true,
    // فقط در محیط غیرپروداکشن برای تست
    devCode:
      process.env.NODE_ENV !== "production" && result2.devMode ? code : undefined,
  });
}
