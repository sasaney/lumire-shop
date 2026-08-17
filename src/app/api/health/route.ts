import { NextResponse } from "next/server";
import { getStorageDebug } from "@/lib/db";

/** وضعیت ذخیره‌سازی — عمومی، بدون افشای کلید */
export async function GET() {
  const debug = getStorageDebug();
  return NextResponse.json({
    ok: true,
    storage: debug,
    time: new Date().toISOString(),
  });
}
