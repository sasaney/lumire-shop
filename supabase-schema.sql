-- این فایل را در Supabase Dashboard → SQL Editor پروژه‌ی خودتان اجرا کنید.
-- (من نمی‌توانم این کار را از سندباکس خودم انجام دهم چون به supabase.co دسترسی شبکه ندارم.)
--
-- این جدول کل دیتابیس اپ را به‌صورت یک ردیف JSONB نگه می‌دارد — ساختار داخلی‌اش
-- دقیقاً همان چیزی است که در src/lib/types.ts (رابط DB) تعریف شده.
-- این رویکرد ساده، برای راه‌اندازی سریع و بدون خطا روی Vercel انتخاب شده؛
-- برای فروشگاه با ترافیک بالا در آینده می‌توان به جدول‌های نرمال‌شده
-- (مطابق prisma/schema.prisma) مهاجرت کرد.

create table if not exists app_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- Row Level Security را فعال می‌کنیم تا فقط از طریق سرویس (service/secret key) قابل خواندن/نوشتن باشد
alter table app_state enable row level security;

-- هیچ policy عمومی‌ای تعریف نمی‌کنیم؛ اپلیکیشن با secret key (که RLS را دور می‌زند) وصل می‌شود،
-- پس کاربران مرورگر مستقیم به این جدول دسترسی نخواهند داشت.
