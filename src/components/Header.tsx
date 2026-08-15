"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useSession } from "@/lib/use-session";
import CategoryMenu from "@/components/CategoryMenu";

export default function Header() {
  const { totalCount } = useCart();
  const session = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      <nav className="glass-morphism border-b border-[#EFE8E1]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-[4.25rem] flex items-center justify-between gap-3">
          {/* راست: منو */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl hover:bg-[#F7EFE9] text-[#2A2421]"
              aria-label={mobileOpen ? "بستن منو" : "باز کردن منو"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? "✕" : "☰"}
            </button>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#2A2421]">
              <CategoryMenu variant="desktop" />
              <Link href="/discounts" className="hover:text-[#D4AF37] transition-colors whitespace-nowrap">
                تخفیف‌های درخشان
              </Link>
              {session?.role === "ADMIN" && (
                <Link href="/admin" className="hover:text-[#D4AF37] transition-colors">
                  پنل
                </Link>
              )}
            </div>
          </div>

          {/* لوگو وسط */}
          <Link href="/" className="flex flex-col items-center group shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-widest text-[#2A2421] group-hover:text-[#D4AF37] transition-colors">
              LUM<span className="text-[#D4AF37]">i</span>R
            </span>
            <span className="hidden sm:block text-[9px] tracking-[0.28em] uppercase text-neutral-400">
              Natural Radiance
            </span>
          </Link>

          {/* چپ: اکشن‌ها */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={session ? "/dashboard" : "/login"}
              className="p-2 rounded-full hover:text-[#D4AF37] transition-colors text-[#2A2421]"
              aria-label={session ? "حساب من" : "ورود"}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </Link>
            <Link
              href="/cart"
              className="relative p-2.5 bg-[#2A2421] text-white rounded-full hover:bg-[#D4AF37] transition-colors shadow-md"
              aria-label="سبد خرید"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-[#2A2421] text-[10px] min-w-4 h-4 px-1 rounded-full flex items-center justify-center font-bold">
                  {totalCount > 99 ? "۹۹+" : totalCount}
                </span>
              )}
            </Link>
            {session && (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden lg:block text-xs px-3 py-2 rounded-xl border border-[#EFE8E1] hover:bg-[#F7EFE9] transition"
              >
                خروج
              </button>
            )}
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 top-[calc(3.5rem)] z-50 flex flex-col bg-[#FDFBF7]/98 backdrop-blur">
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            <CategoryMenu variant="mobile" onNavigate={() => setMobileOpen(false)} />
            <div className="border-t border-[#EFE8E1] pt-3 space-y-1">
              <Link href="/discounts" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-[#F7EFE9]">
                تخفیف‌های درخشان
              </Link>
              {session && (
                <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-[#F7EFE9]">
                  حساب من
                </Link>
              )}
              {session?.role === "ADMIN" && (
                <Link href="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold hover:bg-[#F7EFE9]">
                  پنل مدیریت
                </Link>
              )}
              {session ? (
                <button type="button" onClick={handleLogout} className="block w-full text-right px-3 py-2.5 rounded-xl text-sm font-bold text-[#B89320] hover:bg-[#F7EFE9]">
                  خروج
                </button>
              ) : (
                <Link href="/login" onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#D4AF37] hover:bg-[#F7EFE9]">
                  ورود / ثبت‌نام
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
