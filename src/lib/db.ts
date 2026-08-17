import fs from "fs";
import path from "path";
import type { DB } from "./types";
import {
  defaultFooter,
  defaultLandingSections,
  defaultTrustBadges,
  defaultTestimonials,
  defaultShippingMethods,
} from "./types";

const SEED_PATH = path.join(process.cwd(), "data", "db.json");

function env(...names: string[]): string {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v.trim();
  }
  return "";
}

const SUPABASE_URL = env(
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_PROJECT_URL"
);
const SUPABASE_SECRET_KEY = env(
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SERVICE_KEY",
  "SUPABASE_SECRET"
);
const useSupabase = Boolean(SUPABASE_URL && SUPABASE_SECRET_KEY);
const isVercel = Boolean(process.env.VERCEL);

const STATE_ROW_ID = "main";

const CACHE_TTL_MS = Number(process.env.DB_CACHE_TTL_MS || 1500);
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
  return memoryCache.data;
}

function setCache(db: DB) {
  memoryCache = { data: db, at: Date.now() };
}

export function getStorageMode(): "supabase" | "local-file" | "vercel-ephemeral" {
  if (useSupabase) return "supabase";
  if (isVercel) return "vercel-ephemeral";
  return "local-file";
}

export function getStorageDebug() {
  return {
    mode: getStorageMode(),
    hasUrl: Boolean(SUPABASE_URL),
    hasKey: Boolean(SUPABASE_SECRET_KEY),
    urlHost: SUPABASE_URL
      ? (() => {
          try {
            return new URL(SUPABASE_URL).host;
          } catch {
            return "invalid-url";
          }
        })()
      : null,
    isVercel,
    persistent: getStorageMode() === "supabase" || getStorageMode() === "local-file",
    hint:
      getStorageMode() === "supabase"
        ? "اتصال به Supabase برقرار است — تغییرات باید ماندگار باشند."
        : getStorageMode() === "vercel-ephemeral"
          ? "روی Vercel بدون Supabase هستید. متغیرهای SUPABASE_URL و SUPABASE_SECRET_KEY (یا SUPABASE_SERVICE_ROLE_KEY) را ست کنید و Redeploy بزنید."
          : "حالت فایل محلی (مناسب توسعه).",
  };
}

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

  if (!Array.isArray(db.users)) db.users = [];
  if (!Array.isArray(db.products)) db.products = [];
  if (!Array.isArray(db.categories)) db.categories = [];
  if (!Array.isArray(db.brands)) db.brands = [];
  if (!Array.isArray(db.orders)) db.orders = [];
  if (!Array.isArray(db.otps)) db.otps = [];

  return db;
}

async function readFromSupabase(): Promise<DB> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("app_state")
    .select("data")
    .eq("id", STATE_ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(
      `خطا در خواندن از Supabase: ${error.message} — جدول app_state را در SQL Editor بسازید و کلید service_role را چک کنید.`
    );
  }

  if (!data) {
    const seed = normalizeDb(JSON.parse(fs.readFileSync(SEED_PATH, "utf-8")) as DB);
    await writeToSupabase(seed);
    return seed;
  }

  return normalizeDb(data.data as DB);
}

async function writeToSupabase(db: DB): Promise<void> {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("app_state")
    .upsert({ id: STATE_ROW_ID, data: db, updated_at: new Date().toISOString() });

  if (error) {
    throw new Error(
      `خطا در نوشتن در Supabase: ${error.message} — مطمئن شوید جدول app_state ساخته شده و کلید service_role است (نه anon).`
    );
  }
}

const RUNTIME_PATH = isVercel ? path.join("/tmp", "lumire-db.json") : SEED_PATH;

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

export const database = {
  read: async (): Promise<DB> => readUncached(),
  write: async (db: DB): Promise<void> => {
    if (useSupabase) {
      await writeToSupabase(db);
    } else if (isVercel) {
      throw new Error(
        "ذخیره روی Vercel بدون Supabase ممکن نیست. در Vercel → Settings → Environment Variables این‌ها را بگذارید و Redeploy کنید: SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY (یا SUPABASE_SECRET_KEY)."
      );
    } else {
      writeToFile(db);
    }
    setCache(db);
  },
  invalidate: invalidateCache,
};

export function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
