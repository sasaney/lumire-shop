"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/use-session";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (session === null) router.push("/login?next=/dashboard");
  }, [session, router]);

  if (session === undefined) return <div className="py-24 text-center text-neutral-400">در حال بارگذاری...</div>;
  if (!session) return null;

  const links = [
    { href: "/dashboard", label: "خلاصه حساب" },
    { href: "/dashboard/orders", label: "سفارش‌های من" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 grid md:grid-cols-[200px_1fr] gap-8">
      <aside>
        <div className="bg-white border border-rose-100 rounded-2xl p-4">
          <div className="font-bold mb-1">{session.name}</div>
          <div className="text-xs text-neutral-400 mb-4" dir="ltr">{session.email}</div>
          <nav className="flex md:flex-col gap-1 overflow-x-auto">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`shrink-0 px-3 py-2 rounded-lg text-sm transition ${
                  pathname === l.href
                    ? "bg-rose-50 text-rose-700 font-bold"
                    : "text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}
