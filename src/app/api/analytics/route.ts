import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";

/** بافر حافظه‌ای برای جلوگیری از write کامل DB روی هر pageview */
const pending: Record<string, number> = {};
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_MS = 5000;

async function flush() {
  flushTimer = null;
  const entries = Object.entries(pending);
  if (entries.length === 0) return;
  for (const k of Object.keys(pending)) delete pending[k];
  try {
    const db = await database.read();
    for (const [path, n] of entries) {
      db.pageViews[path] = (db.pageViews[path] || 0) + n;
    }
    await database.write(db);
  } catch {
    // بازگردانی شمارنده‌ها در صورت خطا
    for (const [path, n] of entries) {
      pending[path] = (pending[path] || 0) + n;
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    void flush();
  }, FLUSH_MS);
}

export async function POST(req: NextRequest) {
  let path = "/";
  try {
    const body = await req.json();
    if (body?.path && typeof body.path === "string") path = body.path.slice(0, 200);
  } catch {
    /* sendBeacon / empty */
  }

  pending[path] = (pending[path] || 0) + 1;
  scheduleFlush();

  return NextResponse.json({ ok: true });
}
