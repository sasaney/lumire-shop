import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getStorageMode } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "دسترسی غیرمجاز." }, { status: 403 });
  }
  const mode = getStorageMode();
  return NextResponse.json({
    mode,
    persistent: mode === "supabase" || mode === "local-file",
    message:
      mode === "supabase"
        ? "ذخیره‌سازی پایدار روی Supabase فعال است."
        : mode === "local-file"
          ? "ذخیره‌سازی فایل محلی (فقط روی کامپیوتر خودتان)."
          : "هشدار: روی Vercel بدون Supabase، تغییرات بعد از رفرش از بین می‌روند.",
  });
}
