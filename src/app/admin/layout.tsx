"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (session === null) router.push("/login?next=/admin");
    else if (session && session.role !== "ADMIN") router.push("/");
  }, [session, router]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  if (session === undefined || !session || session.role !== "ADMIN") {
    return (
      <div className="py-24 text-center text-neutral-400 text-sm">در حال بررسی دسترسی...</div>
    );
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex flex-col gap-0.5">
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/admin" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClick}
            className={`admin-nav-link ${
              active ? "admin-nav-link-active" : "text-neutral-500 hover:bg-neutral-50 hover:text-ink"
            }`}
          >
            <span className="opacity-60 ml-1.5 text-xs">{l.icon}</span>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      <div className="lg:hidden flex items-center justify-between gap-3 mb-4 sticky top-14 z-30 bg-[#FDFBF7]/95 backdrop-blur py-2 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="h-11 px-4 rounded-xl bg-[#2A2421] text-white text-sm font-bold flex items-center gap-2"
        >
          <span>☰</span>
          منوی مدیریت
        </button>
        <div className="text-xs text-neutral-500 truncate max-w-[45%]">{session.name}</div>
      </div>

      {menuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="بستن منو"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-0 right-0 h-full w-[min(86vw,320px)] bg-white shadow-2xl border-l border-[#EFE8E1] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#EFE8E1]">
              <div className="font-extrabold text-[#B89320]">پنل مدیریت</div>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="w-10 h-10 rounded-xl hover:bg-[#F7EFE9] text-lg"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <NavLinks onClick={() => setMenuOpen(false)} />
            </div>
            <div className="p-3 border-t border-[#EFE8E1]">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block text-center text-sm font-bold text-[#D4AF37] py-2"
              >
                ← بازگشت به فروشگاه
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-[240px_1fr] gap-5 sm:gap-8">
        <aside className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <div className="admin-sidebar p-3 sm:p-4">
            <div className="flex items-center gap-2 px-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#2A2421] text-white text-xs font-extrabold flex items-center justify-center">
                ل
              </div>
              <div>
                <div className="font-extrabold text-[#B89320] text-sm">پنل مدیریت</div>
                <div className="text-[10px] text-neutral-400 truncate max-w-[140px]">{session.name}</div>
              </div>
            </div>
            <NavLinks />
          </div>
        </aside>

        <div className="min-w-0 w-full overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}
