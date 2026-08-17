import { NextResponse } from "next/server";

/** وضعیت ذخیره‌سازی — عمومی، بدون افشای کلید */
export async function GET() {
  const url =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_PROJECT_URL ||
    "";
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET ||
    "";

  const hasUrl = Boolean(url.trim());
  const hasKey = Boolean(key.trim());
  const isVercel = Boolean(process.env.VERCEL);
  const mode = hasUrl && hasKey ? "supabase" : isVercel ? "vercel-ephemeral" : "local-file";

  let urlHost: string | null = null;
  if (hasUrl) {
    try {
      urlHost = new URL(url).host;
    } catch {
      urlHost = "invalid-url";
    }
  }

  const persistent = mode === "supabase" || mode === "local-file";
  const hint =
    mode === "supabase"
      ? "اتصال به Supabase دیده می‌شود — اگر باز هم داده پاک شد، جدول app_state و کلید service_role را چک کنید."
      : mode === "vercel-ephemeral"
        ? "روی Vercel بدون Supabase هستید. در Settings → Environment Variables بگذارید: SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY سپس Redeploy."
        : "حالت فایل محلی.";

  return NextResponse.json({
    ok: true,
    storage: { mode, hasUrl, hasKey, urlHost, isVercel, persistent, hint },
    time: new Date().toISOString(),
  });
}
