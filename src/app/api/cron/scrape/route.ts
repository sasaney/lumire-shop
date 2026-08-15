import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { runScraperOnDb } from "@/lib/scraper-run";

// این روت را Vercel Cron طبق زمان‌بندی vercel.json صدا می‌زند (نه کاربر).
// برای جلوگیری از فراخوانی توسط افراد ناشناس، با CRON_SECRET محافظت می‌شود؛
// Vercel هنگام صدا زدن کران، هدر Authorization: Bearer <CRON_SECRET> را خودکار اضافه می‌کند
// اگر متغیر محیطی CRON_SECRET را در تنظیمات پروژه ست کرده باشید.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const db = await database.read();
  if (!db.scraperSettings.enabled) {
    return NextResponse.json({ ok: true, skipped: true, reason: "اسکرپر خودکار غیرفعال است." });
  }

  const summary = await runScraperOnDb(db);
  await database.write(db);

  return NextResponse.json({ ok: true, summary });
}
