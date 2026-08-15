import fs from "fs";
import path from "path";
import { cache } from "react";
import type { DB } from "./types";
import {
  defaultFooter,
  defaultLandingSections,
  defaultTrustBadges,
  defaultTestimonials,
  defaultShippingMethods,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "db.json");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);

const STATE_ROW_ID = "main";

/** کش حافظه‌ای کوتاه‌عمر برای کاهش I/O روی هر request */
const CACHE_TTL_MS = Number(process.env.DB_CACHE_TTL_MS || 3000);
let memoryCache: { data: DB; at: number } | null = null;

function invalidateCache() {
  memoryCache = null;
}

function getCached(): DB | null {
  if (!memoryCache) return null;
  if (Date.now() - memoryCache.at > CACHE_TTL_MS) {
    memoryCache = null;
    return null;
  }
  // کپی سطحی کافی نیست برای جلوگیری از mutate؛ اما write همیشه invalidate می‌کند
  return memoryCache.data;
}

function setCache(db: DB) {
  memoryCache = { data: db, at: Date.now() };
}

/** نرمال‌سازی دیتابیس قدیمی به ساختار جدید (بدون از دست رفتن داده) */
export function normalizeDb(raw: DB): DB {
  const db = raw as DB;

  if (!db.settings) {
    (db as any).settings = { slides: [] };
  }
  const s = db.settings as any;
  if (!s.footer) {
    s.footer = defaultFooter();
    if (s.footerText) s.footer.aboutText = s.footerText;
  }
  if (!Array.isArray(s.landingSections) || s.landingSections.length === 0) {
    s.landingSections = defaultLandingSections();
  }
  if (!Array.isArray(s.trustBadges) || s.trustBadges.length === 0) {
    s.trustBadges = defaultTrustBadges();
  }
  if (!Array.isArray(s.testimonials) || s.testimonials.length === 0) {
    s.testimonials = defaultTestimonials();
  }
  if (!Array.isArray(s.slides)) s.slides = [];
  if (s.headerText === undefined) s.headerText = "";
  if (!s.footerText) s.footerText = s.footer?.aboutText || "";

  if (!Array.isArray(db.shippingMethods) || db.shippingMethods.length === 0) {
    db.shippingMethods = defaultShippingMethods();
  }

  for (const p of db.products || []) {
    if (!("shippingMethodIds" in p)) {
      (p as any).shippingMethodIds = null;
    }
  }

  if (!Array.isArray(db.menu)) db.menu = [];
  if (!Array.isArray(db.pages)) db.pages = [];
  if (!Array.isArray(db.scraperLogs)) db.scraperLogs = [];
  if (!db.pageViews) db.pageViews = {};
  if (!db.scraperSettings) {
    db.scraperSettings = {
      enabled: true,
      defaultPriceMarkupPercent: 15,
      defaultDiscountMarkupPercent: 30,
      intervalMinutes: 360,
      liveCheckOnCheckout: false,
      sources: [
        { id: "digikala", name: "دیجی‌کالا", baseUrl: "https://www.digikala.com", active: true },
        { id: "technolife", name: "تکنولایف", baseUrl: "https://www.technolife.com", active: true },
        { id: "custom", name: "URL مستقیم", baseUrl: "", active: true },
      ],
    };
  } else {
    if (db.scraperSettings.enabled === undefined) db.scraperSettings.enabled = true;
    if (!Array.isArray((db.scraperSettings as any).sources)) {
      (db.scraperSettings as any).sources = [
        { id: "digikala", name: "دیجی‌کالا", baseUrl: "https://www.digikala.com", active: true },
        { id: "technolife", name: "تکنولایف", baseUrl: "https://www.technolife.com", active: true },
        { id: "custom", name: "URL مستقیم", baseUrl: "", active: true },
      ];
    }
  }

  return db;
}

async function readFromSupabase(): Promise<DB> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!);

  const { data, error } = await supabase
    .from("app_state")
    .select("data")
    .eq("id", STATE_ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`خطا در خواندن از Supabase: ${error.message}`);

  if (!data) {
    const seed = normalizeDb(JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as DB);
    await writeToSupabase(seed);
    return seed;
  }

  return normalizeDb(data.data as DB);
}

async function writeToSupabase(db: DB): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!);

  const { error } = await supabase
    .from("app_state")
    .upsert({ id: STATE_ROW_ID, data: db, updated_at: new Date().toISOString() });

  if (error) throw new Error(`خطا در نوشتن در Supabase: ${error.message}`);
}

const RUNTIME_PATH = process.env.VERCEL
  ? path.join("/tmp", "lumire-db.json")
  : SEED_PATH;

function ensureRuntimeFile() {
  if (RUNTIME_PATH === SEED_PATH) return;
  if (!fs.existsSync(RUNTIME_PATH)) {
    fs.copyFileSync(SEED_PATH, RUNTIME_PATH);
  }
}

function readFromFile(): DB {
  ensureRuntimeFile();
  const raw = fs.readFileSync(RUNTIME_PATH, "utf-8");
  return normalizeDb(JSON.parse(raw) as DB);
}

function writeToFile(db: DB) {
  ensureRuntimeFile();
  fs.writeFileSync(RUNTIME_PATH, JSON.stringify(db, null, 2), "utf-8");
}

async function readUncached(): Promise<DB> {
  const cached = getCached();
  if (cached) return cached;
  const db = useSupabase ? await readFromSupabase() : readFromFile();
  setCache(db);
  return db;
}

/**
 * خواندن دیتابیس با:
 * 1) dedupe در یک request با React cache
 * 2) کش حافظه‌ای کوتاه‌عمر بین requestها
 */
export const readDatabase = cache(async (): Promise<DB> => readUncached());

export const database = {
  read: readDatabase,
  write: async (db: DB): Promise<void> => {
    if (useSupabase) await writeToSupabase(db);
    else writeToFile(db);
    setCache(db);
  },
  /** باطل کردن کش (مثلاً بعد از اسکرپر پس‌زمینه) */
  invalidate: invalidateCache,
};

export function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
