"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/use-session";

const links = [
  { href: "/admin", label: "نمای کلی", icon: "◈" },
  { href: "/admin/products", label: "محصولات", icon: "▣" },
  { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: "▤" },
  { href: "/admin/brands", label: "برندها", icon: "◇" },
  { href: "/admin/menu", label: "منوی سایت", icon: "☰" },
  { href: "/admin/orders", label: "سفارش‌ها", icon: "◫" },
  { href: "/admin/shipping", label: "روش‌های ارسال", icon: "🚚" },
  { href: "/admin/finance", label: "مالی", icon: "﷼" },
  { href: "/admin/scraper-settings", label: "تنظیمات اسکرپر", icon: "↻" },
  { href: "/admin/scraper-log", label: "لاگ اسکرپر", icon: "☰" },
  { href: "/admin/marketing", label: "مارکتینگ", icon: "✦" },
  { href: "/admin/content", label: "محتوا و بلاگ", icon: "✎" },
  { href: "/admin/settings", label: "تنظیمات سایت", icon: "⚙" },
  { href: "/admin/users", label: "کاربران", icon: "☺" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.push("/login?next=/admin");
    else if (session && session.role !== "ADMIN") router.push("/");
  }, [session, router]);

  if (session === undefined || !session || session.role !== "ADMIN") {
    return (
      <div className="py-24 text-center text-neutral-400 text-sm">در حال بررسی دسترسی...</div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-10 grid lg:grid-cols-[240px_1fr] gap-5 sm:gap-8">
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <div className="admin-sidebar p-3 sm:p-4">
          <div className="flex items-center gap-2 px-2 mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-600 to-sage-600 text-white text-xs font-extrabold flex items-center justify-center">
              ل
            </div>
            <div>
              <div className="font-extrabold text-rose-700 text-sm">پنل مدیریت</div>
              <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{session.name}</div>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-0.5 overflow-x-auto lg:overflow-visible pb-1 lg:pb-0 -mx-1 px-1">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`admin-nav-link shrink-0 whitespace-nowrap ${
                    active ? "admin-nav-link-active" : "text-neutral-500 hover:bg-neutral-50 hover:text-ink"
                  }`}
                >
                  <span className="opacity-60 ml-1.5 text-xs">{l.icon}</span>
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
