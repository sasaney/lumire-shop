import nodemailer from "nodemailer";

// اگر متغیرهای SMTP در .env تنظیم شده باشند، ایمیل واقعی ارسال می‌شود.
// در غیر این صورت (حالت توسعه) کد فقط در ترمینال چاپ می‌شود تا بدون
// نیاز به تنظیم سرور ایمیل هم بتوانید سایت را تست کنید.

const hasSmtp =
  !!process.env.SMTP_HOST &&
  !!process.env.SMTP_USER &&
  !!process.env.SMTP_PASS;

export async function sendOtpEmail(to: string, code: string) {
  if (!hasSmtp) {
    console.log(`\n[OTP DEV MODE] کد تایید برای ${to}: ${code}\n`);
    return { devMode: true };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: "کد ورود به لومیر",
    html: `<div style="font-family:sans-serif;text-align:right;direction:rtl">
      <p>کد ورود شما به لومیر:</p>
      <h2 style="letter-spacing:4px">${code}</h2>
      <p>این کد تا ۵ دقیقه معتبر است.</p>
    </div>`,
  });

  return { devMode: false };
}
