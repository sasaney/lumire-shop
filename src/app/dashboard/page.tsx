"use client";

import { useSession } from "@/lib/use-session";

export default function DashboardHome() {
  const session = useSession();
  if (!session) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-extrabold">خلاصه حساب</h1>
      <div className="bg-white border border-rose-100 rounded-2xl p-6">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-neutral-400">نام</div>
            <div className="font-bold mt-1">{session.name}</div>
          </div>
          <div>
            <div className="text-neutral-400">ایمیل</div>
            <div className="font-bold mt-1" dir="ltr">{session.email}</div>
          </div>
        </div>
      </div>
      <p className="text-sm text-neutral-500">
        از منوی «سفارش‌های من» می‌توانید وضعیت سفارش‌های خود را پیگیری کنید.
      </p>
    </div>
  );
}
